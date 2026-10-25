## Context

- **Planning.** `calculateGoalResourceNeed` walks goals in effective priority order with one `UnitCoverage` per unit. That's `{ primary, secondary, rankSlots }`, so Rank slots and ability transitions are already claimed once across Rank, Ability and Upgrade goals. Ascension has no coverage. `ascensionResourceNeed` sums every step from `max(start, current)` to `end` and subtracts _all_ owned shards per goal, so two Ascension goals for one unit double count both the overlapping steps and the owned shards.
- **Creation.**
  - `useGoalPrerequisites.needsAscension` compares targets only with current progression.
  - `findGoalSlotConflict` keys non-Rank types by `(unit, goalType)`.
  - `goal-spec-builder` builds at most one spec per type.
- **Blockers.** `implicit-prerequisite-blockers` finds a covering Ascension with `find`. Otherwise it points the remedy at "the" in-flight Ascension goal (`conflictingAscensionGoalId`).
- **Companion API change `support-multiple-goals-per-unit`:**
  - Target keys per type, with Unlock unkeyed.
  - Repeated types in one combined request.
  - `CombinedGoalSpec.dependsOnGoalIds`.
  - `slotOccupied.normalizedTarget` for every keyed type.

## Goals / Non-Goals

**Goals:** V1 parity for multiple goals per unit and type (except Unlock) with correct, non-double-counted estimates; Ragnar's ladder flow without slot collisions; consistent labels everywhere.

**Non-Goals:**

- A multi-unit bulk creator. That's a follow-up; the ladder is per unit here.
- Changing Rank allocation (`rank-milestone-planning` stays).
- Auto-reordering milestones.

## Decisions

1. **The target key lives in `entities/goal`** as `goalTargetKey(detail | spec)`, exported from its `index.ts` beside `rankTargetKey` (`model/rank-target-key.ts`) and mirroring the server's `GoalTargetKey`. Rank delegates to `rankTargetKey`. `features/goal-create` (pre-check), `features/goal-planning` (conflict copy, blockers) and `pages/goals/ui` (labels) consume it through the entity's public API only, so no feature-to-feature import is added. The Ascension coverage stays inside `features/goal-farming` and reaches its consumers through the existing `@x/daily-raids`, `@x/goal-planning` and `@x/shop-recommendations` surfaces. `findGoalSlotConflict` compares it for every type. The type-specific `rankTargetKey` param is replaced by a `targetKey` computed from the spec being placed, one per spec when a request carries several.
2. **Ascension coverage.** Extend `UnitCoverage` with `ascension: { steps: Map<step, goalId>; shardDraws: Map<goalId, { shards; mythicShards }> }`, one per unit per plan build.
   - `ascensionResourceNeed` takes an optional `{ goalId, allocation }`. It charges only steps no other goal claimed, claims the rest for this goal, and nets against owned shards minus what _other_ goals drew, recording this goal's own draw.
   - Keyed by goal rather than a decrementing pool, because plan builders compute one goal's need several times (gross demand with the stock zeroed, then net, then stages). A repeated call reads back the same allocation, and a gross-demand call (owned stock zeroed) leaves the recorded draw alone.
   - Without coverage (standalone estimates) behavior is unchanged.
   - Owned orbs are not netted per goal today, and this change doesn't start doing so.
   - One canonical result: detailed rows and plan totals both come from this same allocation, as Rank does.
3. **Milestone-aware Ascension suggestion.** `needsAscension` also receives the unit's in-flight Ascension goals.
   - If one ends at or above the required progression, return `{ kind: "existing", goalId }`. The review shows "Depends on _Ascension → X_", the spec gets `dependsOnGoalIds: [goalId]`, and no Ascension spec is added.
   - Otherwise suggest a new Ascension from current progression to the minimum required end. If an in-flight goal already has exactly that end (impossible here, because it would cover), nothing collides.
   - _Alternative:_ raise the existing goal's target. Rejected as the default: it changes a goal the user deliberately set (e.g. "Legendary first, Mythic later"). It stays available through the blocker remedy and edit dialog.
4. **Ladder creation.** The Rank, Ascension and Ability cards get "Add milestone", which appends another end target of the same type. Each later target must be above the previous one (validation reuses the card's own rules).
   - The submission builds one spec per milestone in order, each with `dependsOnIndex: [previous]`.
   - An Ascension prerequisite (if any) is placed before the first milestone that needs it, and every milestone needing it depends on it.
   - Upgrade has no ladder (its target is a material list).
   - Desktop dialog and mobile sheet render the same card content, with no interaction split. The milestone list stacks vertically in both.
5. **Display.** Goal rows and cards use one `goalTargetLabel(detail)` for every type, e.g. "Rank → Diamond 3", "Ascension → Legendary ★5", "Ability → 50/45", or Upgrade's material count. The displayed range start is the end of the nearest in-flight, higher-priority goal of the same unit and type that ends below this one, else the live progression. This is display only; stored `start` is untouched. A goal whose allocated demand is zero because a sibling covers it shows a "Covered by _sibling label_" note.
6. **Blocker remedy.** When a too-low in-flight Ascension goal exists, the missing-Ascension reason offers two actions: create a covering Ascension milestone (creation prefilled with the required end), and review the existing goal. Once the covering milestone exists, `coveringAscensionGoal` finds it and the reason clears. No dependency edge is added to the blocked goal, because the edit endpoint does not change `dependsOn`. The new milestone is placed by normal creation order, and the user can reorder it.

## Risks / Trade-offs

- [The order the API and apps ship in] → the API applies first. Until the client ships, its own slot pre-check still blocks same-type creation, so no unallocated duplicates can appear from the UI.
- [Shard pool vs acquisition sources: two Ascension milestones with different sources] → each milestone keeps its own sources for farming; only owned shards are pooled.
- [Longer goal lists] → existing grouping by unit and filters apply; no cap.

## Open Questions

- Should the ladder also be offered from the Legendary Event plan wizard for its Rank steps? Out of scope here.
