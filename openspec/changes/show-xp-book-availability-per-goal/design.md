## Context

See proposal.md - Why/What Changes. The relevant pipeline today:

- `allocateLevelXp` (`features/goal-farming/lib/level-xp-allocation.ts`) walks every Rank/Ability goal's `LevelXpNeed` in priority order, spending a shared, mutated `Partial<Record<Rarity, number>>` book pool per unit via `consumeOwnedBooks`. It already returns `chargedXp` (this goal's own raw-XP interval, excluding levels a higher-priority goal of the same unit already covers), `potentialLevel`, and `remainingXp` (still-unmet after this goal's own spend) — but nothing about how large the pool was _before_ this goal spent from it.
- `buildLevelPotentialProgress` (`pages/goals/model/insights/level-potential-progress.ts`) calls `allocateLevelXp` once per plan and exposes `ratioByGoalId` (level-based Potential %, already correct and unchanged by this work) and `remainingXpByGoalId` (feeds the "additional books" figure being replaced).
- `use-goal-detail-metrics.ts` converts `levelXpRemaining` to `additionalBookCount` via `xpBookEquivalent` (ceil), rendered only by `goal-detail-sheet.tsx` → `goal-detail-header.tsx` → `LevelRequirementSummary` → `LevelRequirementRemaining`.
- `goals-list.tsx` (desktop table) and `goals-mobile-cards.tsx` call `LevelRequirementRemaining` without `additionalBookCount`/`xpBookRarity` at all — the actual bug being fixed.
- `computeLevelGoalCost` (create-goal preview, `xpBookEquivalent` on `netXpAgainstOwnedBooks`) is a separate, unrelated calculation (no established priority position yet since the goal doesn't exist) and is out of scope — untouched.

## Goals / Non-Goals

**Goals:**

- Expose, per goal, the raw-XP size of the shared owned-book pool at that goal's turn in priority order (a genuinely new piece of domain data).
- Replace the "additional books needed" (shortfall) display with an available/needed pair, computed from raw XP and rounded only for display.
- Make that pair render everywhere a goal's level requirement already renders (list, mobile cards, project detail, detail view) — today it renders only in the detail view.

**Non-Goals:**

- No change to the level-based Potential progress bar/percentage — it already exists, is already rarity-independent, and stays as the single source of "how close is this goal" framing.
- No change to `computeLevelGoalCost` / the create-goal preview.
- No new capability, no API change.

## Decisions

**Expose pool size via a new `LevelXpAllocation.poolXpAvailable` field, not a new function.** `allocateLevelXp` already iterates needs in priority order and mutates a local `pool` variable; the only change needed is to sum that pool's raw XP (`Σ count × bookValue[rarity]`) _before_ calling `consumeOwnedBooks` for the current goal, and store it on the per-goal result alongside the existing `chargedXp`/`potentialLevel`/`remainingXp`. This keeps the whole allocation in one pass, one function, one existing test file to extend — no new exported helper, no second traversal.

Alternative considered: recompute pool state from `remainingXp` deltas after the fact in `level-potential-progress.ts`. Rejected — that would require reconstructing per-rarity pool composition outside the function that already tracks it, duplicating knowledge of `consumeOwnedBooks`'s spend order for no benefit.

**Needed comes from the already-exposed `chargedXp`, not a new field.** `needed = ceil(chargedXp / bookValue[selectedRarity])` — `chargedXp` is already returned and already correctly excludes levels a higher-priority goal of the same unit covers. No new domain concept.

**Replace `levelXpRemainingByGoalId` rather than add alongside it.** Its only consumer (`use-goal-detail-metrics.ts`'s `additionalBookCount`) is being replaced, so the shortfall map becomes dead weight if kept. `PlanInsightsResult`/`LevelPotentialProgress` gain two new maps (`levelChargedXpByGoalId`, `levelPoolXpAvailableByGoalId`) in place of `levelXpRemainingByGoalId`; `ratioByGoalId`/`levelPotentialProgressByGoalId` (the Potential % map) is untouched.

**Compute the available/needed book counts once per plan, in `level-potential-progress.ts`, not per-row in the UI.** The selected rarity is already a `usePlanningSettings()` read; centralizing `available`/`needed` alongside the existing `ratioByGoalId` computation (rather than recomputing per row in `goals-list.tsx`/`goals-mobile-cards.tsx`) keeps one canonical result and guarantees the list, cards, and detail view can never disagree (mirrors the existing project convention of computing shared per-goal metrics once and threading `ReadonlyMap<string, T>` down).

**Thread `xpBookRarity` down through `GoalsListProps` alongside the two new maps.** `goals-page.tsx` and `project-detail-page.tsx` both need to call `usePlanningSettings()` (or receive it) to pass `xpBookRarity` to `GoalsList`, matching how `goal-detail-sheet.tsx` already does it. `LevelRequirementRemaining` gains `availableBookCount`/`neededBookCount` props alongside its existing `xpBookRarity`, replacing `additionalBookCount`.

**Desktop and mobile:** no layout-level difference — both `goals-list.tsx`'s desktop table and `goals-mobile-cards.tsx` call the same shared `LevelRequirementRemaining`, so passing the new props to both call sites is the entire mobile-specific work. No new Joyride step needed — this augments an existing, already-toured remaining-text line rather than adding a new interactive control.

**Locale copy:** replace `goals.overview.remainingText.additionalBooks` with a new key expressing "`{{available}}/{{needed}} {{rarity}} books`" (exact wording decided during `en` translation, mirrored to `de`/`es`/`fr`), rather than reusing the old key's interpolation shape, since the meaning inverts (was a single shortfall count, now a pair).

## Risks / Trade-offs

- [Risk] `available` can be a large, uninformative number for a low-priority goal behind many higher-priority ones sharing the same big pool (e.g. "87/1") before the pool is actually depleted, which could read as noise rather than signal. → Mitigation: this is the framing the user explicitly asked for (uncapped, matches their worked example) and it's still strictly more informative than today's nothing; revisit only if real usage shows it's confusing.
- [Risk] Rounding direction differs between `available` (floor) and `needed` (ceil), so `available >= needed` doesn't perfectly guarantee zero raw-XP shortfall at extreme edge values (e.g. `available` floors down just below an exact multiple). → Mitigation: the Potential progress bar/percentage remains the authoritative "is this actually covered" signal (raw-XP-based, no rounding); the book counts are explicitly a display equivalent, consistent with the existing "equivalent, not guaranteed source" framing already in the spec.
- [Risk] Removing `levelXpRemainingByGoalId` is a breaking change to `PlanInsightsResult`'s shape. → Mitigation: it's an internal domain type with one consumer, all within this repo; no external contract.

## Migration Plan

Single-PR change, no data migration, no feature flag — pure client-side calculation and display. Revert is a plain code revert if needed.
