## Context

See `proposal.md` for motivation. Today, three sibling functions each independently decide whether a goal's target is already met by the player's synced state: `computeGoalAttainment` (`goal-attainment.ts`) gets this right for every goal kind already. `computeGoalProgress` (`goal-progress.ts`) clamps its `ratio` output for Ascension and Level but returns the raw, unclamped live value as `current` for Rank, Ascension, and Level — the value `GoalProgressDisplay` badges next to the target. `calculateGoalResourceNeed`'s `"Unlock"` branch (`goal-requirements.ts`) never receives the player's roster at all, so it can't know the character is already owned. Separately, the Actual/Potential Progress explanatory copy exists only as `goal-detail-view.tsx`'s own extra paragraph, rendered next to — not inside — the shared `GoalProgressDisplay` component that the goals list and project cards also use.

## Goals / Non-Goals

**Goals:**

- Cap `computeGoalProgress`'s displayed `current` at the goal's own target for Rank, Ascension, and Level, independently of each kind's existing `ratio` computation.
- Gate the Unlock resource-need branch on ownership, mirroring the pattern `goal-attainment.ts` already uses (`fromBoolean(!!owned)`).
- Move the Actual/Potential explanatory copy into `GoalProgressDisplay` itself so every caller renders it for free, instead of duplicating it per caller.

**Non-Goals:**

- Not changing whether a goal is bucketed into Reached/Unfulfilled — that's `computeGoalAttainment`'s job, and it is already correct for every affected goal kind.
- Not touching the Ability or Upgrade goal kinds — their progress fields (`currentActive`/`currentPassive`, or a ratio-only ceiling) aren't raw ladder positions and don't exhibit this shape of bug.
- Not renaming "Actual Progress"/"Potential Progress" — the testers' own acceptance criteria accept an explanation in place of a rename.
- Not deciding whether an already-attained goal should be more aggressively hidden or archived from a project's default view — that's existing Reached/Unfulfilled bucketing behavior, unchanged here.

## Decisions

1. **Clamp at the read site (`computeGoalProgress`), not by mutating stored goal config.**
   Alternative considered: auto-adjust the goal's stored `config.progression`/`config.rank`/`config.level` end once attainment flips. Rejected — that's a lifecycle/mutation decision requiring a write path and conflict handling, well outside this change. `goal-attainment.ts`'s existing convention ("Reached is computed, never a stored flag") already treats "the player overtook the target" as a derived fact, not something that rewrites the goal; clamping only the display value keeps this a pure read-side fix consistent with that convention.

2. **Cap the displayed `current` at the target independently of each kind's existing `ratio` computation, rather than reusing a shared clamped local for both.**
   Ascension and Level each already compute a `clampedCurrent` local, but only for `ratio`, and it is two-sided (`Math.min(Math.max(current, start), end)`) — it floors at `start` as well as capping at `end`, which is correct for a ratio (progress before the goal's start must read 0%, not negative) but wrong for the _displayed_ value (a stale or misconfigured `start` ahead of the player's true, lower progression must never be shown in place of that true value — see the spec's "below start" scenario). Reusing that local for `current` would also silently disagree with Rank, whose `ratio` isn't index-clamped at all — it's `completedSlots / totalSlots` from `appliedUpgradeSlots` — so there is no existing per-kind local to extend uniformly.
   Instead, `current` gets its own one-sided cap in each of the three cases, left entirely independent of that kind's `ratio` formula:
   - **Ascension**: `current: currentIndex > endIndex ? (target.end as Progression) : (ownedUnit.progressionIndex as Progression)` — `clampedCurrent` is a numeric `progressionOrder` index, not assignable to the string-typed `current: Progression` field, so this cannot reuse it directly.
   - **Rank**: `current: currentIndex > target.end ? rankAt(target.end) : params.playerCharacter.rank` — the existing slot-based `ratio` already treats an overshoot as complete (`currentIndex > target.end ? totalSlots : ...`) and needs no change.
   - **Level**: `current: Math.min(current, target.end)` — same one-sided cap; the existing two-sided `clampedCurrent` local stays untouched and keeps feeding only `ratio`.

3. **`GoalProgressDisplay` renders the explanation copy itself; `goal-detail-view.tsx`'s own paragraph is deleted, not kept alongside it.**
   Alternative considered: keep the detail view's separate paragraph and only add the explanation to the list/card call sites. Rejected — the `goal-progress-display` spec requires exactly one explanation per bar wherever it renders; a second, separately-worded copy in the detail view risks drifting from the shared one, and there's no product reason the detail view needs different wording.
   The Actual Progress explanation is new copy (no existing string to reuse). Potential Progress's existing `goals.detail.potentialProgressDescription` string is reused as-is — its content is accurate regardless of render location; only its i18n key's namespace may move to sit next to the sibling `goals.overview.actualProgress`/`potentialProgress` labels it's now always paired with. Exact key naming is a task-level detail (see Open Questions).

4. **The "doesn't imply uniform usefulness" requirement (from GUI-10) is satisfied by wording alone — no new visual treatment.**
   No progress-bar color or fill-pattern change is introduced to distinguish "80% done, functionally usable" from "80% done, functionally useless for some use case." GUI-10's own issue frames itself as design context/a constraint, not a mandate for new behavior; keeping the explanation copy from overclaiming is the cheapest way to satisfy it.

## Risks / Trade-offs

- **Clamping `current` changes `GoalProgress`'s returned value for every consumer of `computeGoalProgress`.** → `goal-progress.ts`'s own header comment documents it as a pure calc consumed only by the display layer, and a grep confirms `GoalProgressDisplay` is the only renderer of `.current`/`.target` today. `pnpm typecheck` plus existing tests will surface a surprise second consumer if one exists.
- **Moving the Potential Progress explanation into `GoalProgressDisplay` could double-render it if some caller keeps its own copy.** → Deleting `goal-detail-view.tsx`'s paragraph in this same change removes the only such caller. Add a test asserting each explanation renders exactly once in the detail sheet.
- **The Unlock resource-need fix changes a number surfaced in several downstream views at once** (goals overview remaining, Dailies, Insights, Shop-needs), since `calculateGoalResourceNeed` is one shared function. → This is the intended fix, but a mistake here is felt everywhere at once. Cover it with a direct unit test on `calculateGoalResourceNeed`/`unlockResourceNeed`, in addition to the existing per-consumer tests (e.g. `plan-insights-calc.test.ts`).

## Migration Plan

None needed. No data migration, no API contract change, no stored data shape change — this is a client-only logic and copy fix behind existing reads. Ships and rolls back like any other frontend-only PR.

## Open Questions

- Exact i18n key names for the relocated/new explanation strings (for example, whether the Potential Progress string moves under the `goals.overview.*` namespace or stays under `goals.detail.*` and is just referenced from its new render location). Doesn't change the spec, the approach, or the task breakdown — only the key name; resolve during implementation.
