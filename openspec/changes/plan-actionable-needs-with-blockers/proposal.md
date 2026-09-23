## Why

`PLAN-014` reports that one unavailable Rank material can remove an otherwise useful goal from the raid plan. The estimator currently exits the goal's stage scan on the first unavailable requirement, so obtainable work is lost and the resulting guidance cannot distinguish partial progress from completion.

## What Changes

- Classify each outstanding requirement independently after inventory, selected sources, and player eligibility are applied.
- Schedule obtainable work while retaining explicit unsatisfied blockers and withholding a completion date when any true blocker remains.
- Present the same partial-plan result in Goals/Insights, Today, and Raids Plan; keep unsupported acquisition sources out of the calculation.

## Capabilities

### New Capabilities

- `partial-goal-planning`: Canonical actionable-versus-blocked requirement result and its cross-surface presentation.

### Modified Capabilities

None. The existing farming-estimate and blocker contracts remain in force; this delta adds behavior for a mixed actionable/blocked goal.

## Impact

Initially `tacticus-planner-apps`: `features/goal-farming` need derivation and scheduling, shared estimate result types, Goals/Insights and Dailies consumers, tests and translations. No API contract is expected; if tracing finds missing server-owned acquisition data, create a same-named API companion before implementation.
