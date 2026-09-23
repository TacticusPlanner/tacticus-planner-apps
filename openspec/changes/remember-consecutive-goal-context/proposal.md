## Why

Creating several related goals repeatedly resets project and goal-type choices (`PLAN-004`). The context is useful across consecutive creations, but should not carry unit-specific targets or override an explicit project-scoped launch.

## What Changes

- Remember the last chosen project memberships and compatible goal types for subsequent creation in the current app session, including Create another.
- Keep remembered choices editable; let explicit launch prefill win, and reset unit-specific targets and start-paused state.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `goal-creation`: Define remembered context and refine the existing Create-another reset behavior.

## Impact

Apps goal-creation form/reset and launcher state. Coordinate with the in-flight `add-contextual-goal-creation-entry-points` change; no API change.
