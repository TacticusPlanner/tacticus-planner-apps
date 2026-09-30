## Why

`PLAN-014` reports that one unavailable Rank material can remove an otherwise useful goal from the raid plan. The estimator currently exits the goal's stage scan on the first unavailable requirement, so obtainable work is lost and the resulting guidance cannot distinguish partial progress from completion.

## What Changes

- Classify each outstanding requirement independently after inventory, selected sources, and player eligibility are applied.
- Schedule obtainable work while retaining explicit unsatisfied blockers and withholding a completion date when any true blocker remains.
- Present the same partial-plan result in Goals/Insights, Today, and Raids Plan; keep unsupported acquisition sources out of the calculation.
- Make every estimate surface use one campaign node-eligibility rule (Goals currently keeps all event-campaign nodes, so it can call a need farmable that Today and Raids Plan report as blocked).
- On Goals, present a partly blocked goal as "Restricted" and a goal with nothing obtainable as "Blocked", naming the unavailable materials and showing no completion date.

## Capabilities

### New Capabilities

- `partial-goal-planning`: Canonical actionable-versus-blocked requirement result and its cross-surface presentation.

### Modified Capabilities

None. The existing farming-estimate and blocker contracts remain in force; this delta adds behavior for a mixed actionable/blocked goal. Follow-up worth considering: fold the active-event rule into `goal-farming-estimates`' "Campaign farming considers only unlocked nodes" requirement (a delta file under `specs/goal-farming-estimates/`, deferred to `/opsx:continue`).

## Impact

Initially `tacticus-planner-apps`: `features/goal-farming` need derivation and scheduling, shared estimate result types, Goals/Insights and Dailies consumers, the Goals catalog's node-eligibility source (`use-goal-catalog.ts`, `unlocked-battles.ts`), the Goals blocked/restricted indicator, tests and translations. No API contract is expected; if tracing finds missing server-owned acquisition data, create a same-named API companion before implementation.
