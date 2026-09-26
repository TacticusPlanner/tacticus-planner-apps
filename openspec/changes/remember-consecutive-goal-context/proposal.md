## Why

Creating several related goals repeatedly resets project and goal-type choices (`PLAN-004`). The context is useful across consecutive creations, but should not carry unit-specific targets or override an explicit project-scoped launch.

## What Changes

- Remember the last chosen project memberships and compatible goal types for subsequent creation in the current app session, including Create another.
- Keep remembered choices editable; let explicit launch prefill win, and reset unit-specific targets and start-paused state.
- With no explicit prefill and nothing remembered, creation keeps preselecting the user's Default project (there is no Active/Current-plan project to consult).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `goal-creation`: Define remembered context and refine the existing Create-another reset behavior.

## Impact

Apps goal-creation form/reset and launcher state. Builds on the archived `add-contextual-goal-creation-entry-points`, whose project-scoped launch precedence now lives in the `goal-creation-entry-points` main spec (Project Detail launches, including the global entry points used on `/plan/projects/:projectId`, preselect the viewed project and always win over remembered membership). No API change.
