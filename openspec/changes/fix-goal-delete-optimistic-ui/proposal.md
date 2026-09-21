## Why

Deleting a goal today waits for the full network round trip before the row
disappears (~3-4 seconds per tester report, vs. V1's ~1-2 seconds), and a
"Goal deleted" success toast can land directly over the next goal row a user
is about to act on. Pause/resume on the same row already solved this exact
problem with an optimistic cache patch; delete never got the same treatment.

## What Changes

- `remove()` in `use-goal-actions.ts` patches the goal out of every cached
  goal list (mirroring `setStatus`'s existing `patchStatusCache` pattern,
  applied to removal instead of a status field edit) before awaiting the
  network request, and re-inserts it on failure.
- Drop the "Goal deleted" success toast on delete, matching pause/resume's
  existing no-toast-on-success precedent — the row vanishing immediately
  already confirms the action.
- **Non-goal, explicitly out of scope**: bulk/multi-select delete. The
  source issue (`GP-37`) flags this as a genuinely open, undecided product
  question with no existing UI to build on (no multi-select exists anywhere
  in the goals pages today). The reported complaint is specifically about
  per-delete latency and toast obstruction, both of which optimistic
  single-delete resolves directly. See design.md for the full rationale.

## Capabilities

### New Capabilities

- `goal-deletion`: how deleting a goal behaves from the user's perspective —
  immediate removal, failure recovery, and feedback. No existing capability
  covers delete; `goal-status-actions` is scoped to pause/resume/archive
  only (its own Purpose statement excludes delete).

### Modified Capabilities

(none)

## Impact

- `apps/web/src/fsd/pages/goals/model/goals-data/use-goal-actions.ts` —
  `remove()` gains an optimistic cache patch and drops its success toast.
- `apps/web/src/fsd/pages/goals/model/goals-data/optimistic-goal-status.ts`
  (or a new sibling file, per design.md) — a removal-shaped counterpart to
  `applyOptimisticGoalStatus`.
- No backend/API change — this is a client-side cache-patch fix, same as
  the existing `setStatus` optimistic pattern it mirrors.
