## Why

The shared goal-membership picker only lists existing projects. Creating a missing project currently interrupts new-goal or goal-edit work and risks losing the unsaved form (`PLAN-006`).

## What Changes

- Offer an explicit Create action for a searched name that does not match an existing project, in both new-goal and goal-edit membership pickers.
- Reuse project naming validation and creation; select the returned project immediately while preserving unsaved goal fields and handling failure in place.
- Never create a project merely because the user typed search text.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `goal-project-membership`: Add inline project creation to the shared membership picker.

## Impact

Apps `GoalProjectsField`, project creation/refresh, Create Goal and goal-edit forms. Existing project API only; no new endpoint.
