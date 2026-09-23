## Why

Changing a goal's destination currently requires deleting and recreating it, which discards its identity, history, memberships, and planning context. Goal owners need to adjust a target as their plan changes without rebuilding the goal.

## What Changes

- Add an explicit target-edit action to eligible goal details on desktop and mobile, prefilled from the stored target.
- Validate the revised target and save it through the revision-checked API operation, retaining the existing goal and unrelated fields.
- Recompute goal progress, estimates, blockers, and dependent planning surfaces after a successful edit; explain conflicts without losing the user's draft.
- Keep target editing unavailable for Unlock goals and terminal goal statuses in this first release.

## Capabilities

### New Capabilities

- `goal-target-editing`: In-place target editing, validation, save feedback, and refreshed planning in the client.

### Modified Capabilities

None. Existing goal creation and progress rules still apply to the resulting target.

## Impact

- Companion API change: `tacticus-planner-api/openspec/changes/edit-goal-targets-in-place`; apply API first.
- Affects the goal detail sheet, goal entity API/types, cache invalidation and client-side planning selectors; no new page.
- Depends on `integrate-level-progression-into-rank-goals` and `support-multiple-rank-milestones` for correct Rank semantics and collision handling.
