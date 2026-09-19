## Why

A goal for a unit the player has not unlocked currently tells the user
"Player data for this goal hasn't synced yet." That is false — the data synced
fine, the character simply is not owned — and it reads as if the app is
broken. The user is given no indication that the real remedy is an Unlock
goal.

The cause is that the blocker model has no reason for a missing Unlock. The
implicit-prerequisite detector returns nothing at all when the unit is absent
from the roster, and goal attainment reports "unknown" for the same reason, so
the only surviving reason is the generic player-data-unavailable one.

This is most visible right after a V1 goal import, where a plan can carry
many goals for not-yet-unlocked characters, producing a list of goals that all
claim a sync problem.

## What Changes

- A new blocker reason for a missing Unlock prerequisite. It applies when the
  account's player data **has** loaded and the target unit is absent from the
  roster, for any goal type that requires the unit to exist.
- The generic player-data-unavailable reason is narrowed to what its name says:
  player data has not loaded or is unavailable. It is no longer produced for a
  loaded roster that simply does not contain the unit.
- The new reason is suppressed when the plan already contains a non-archived
  Unlock goal for that unit — matching how the existing Ascension and Level
  prerequisite reasons are suppressed by a covering goal.
- The new reason offers the same "create prerequisite goal" / "review existing
  prerequisite" affordance the existing prerequisite reasons offer, pre-filled
  for an Unlock goal on that unit.
- An Unlock goal itself is never blocked by this reason.

No API change. No new endpoint, no contract change, no schema change.

## Capabilities

### New Capabilities

- `goal-blocker-reasons`: the set of reasons a goal is shown as blocked, how
  each is derived from live player data and the plan's other goals, which are
  suppressed by a covering goal, and how they are presented and remedied.

### Modified Capabilities

<!-- none -->

## Impact

- `apps/web/src/fsd/pages/goals/model/blockers/goal-blockers.ts` — the reason
  union and the aggregation that decides `isBlocked`.
- `apps/web/src/fsd/pages/goals/model/blockers/implicit-prerequisite-blockers.ts`
  — currently returns nothing for a unit absent from the roster; that early
  exit is what must change.
- `apps/web/src/fsd/pages/goals/model/attainment/` — the attainment result for
  a goal whose unit is not owned must stop being the sole driver of the
  player-data-unavailable reason.
- `apps/web/src/fsd/pages/goals/model/blockers/prerequisite-prefill.ts` — maps
  a reason to a create-goal prefill; gains the Unlock case.
- `apps/web/public/locales/{en,de,es,fr}/common.json` — a new reason message
  under the existing goal-blocked reason keys, in every supported locale.
- No companion `tacticus-planner-api` change. This is derived client-side from
  data the API already returns.
- Relationship to other changes: independent of `rewrite-v1-goal-import`, but
  it is what makes that change's imported plans legible. It can ship first and
  alone.
