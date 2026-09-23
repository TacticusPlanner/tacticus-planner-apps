## Why

Goals currently inherit priority from whichever project a page selected, so a player cannot state one immediate plan across projects and a shared goal can compete in multiple orders. The client needs one editable account-wide plan that all execution and estimate surfaces consume.

## What Changes

- Add an ordered global Goals plan at `/goals/plan`, with desktop drag and mobile reorder mode, displaying Active and Paused goals from every project once.
- **BREAKING**: Project pages become filtered, read-only projections of global order; remove project-local priority controls and stop treating Current plan as an execution selector.
- Make Today, Raids Plan, Insights, and priority-sensitive estimates consume one canonical active-goal order and one shared resource/energy allocation, including mixed Character/Machine-of-War goals. Project filters remain browsing/summary filters only.
- Preserve per-goal pause/resume and non-priority Overview filters/groupings; distinguish empty, loading, and failed global plans.
- Retain the existing `/goals` landing until the separate `make-global-plan-the-goals-landing` change switches it.

## Capabilities

### New Capabilities

- `global-goal-priority`: Global plan view, reordering, conflict recovery, and shared execution scope.

### Modified Capabilities

- `project-management`: Project copy and detail order become projections; project-local reorder controls retire.
- `goals-navigation`: Current plan no longer selects execution scope; project selectors/filters are browsing-only.
- `daily-raids-today`: Today uses all Active goals in global order instead of a selected project.
- `daily-raids-plan`: Raids Plan shares the same global engine and no project selector.
- `goal-farming-estimates`: Shared inventory and energy allocation are account-wide in global order.
- `goal-progress-display`: Potential progress and its explanation use account-wide priority rather than a selected project.
- `goal-detail-estimate-display`: Plan-aware goal dates account for globally higher-priority work.
- `goal-list-estimate-display`: The global plan can show plan-aware dates without selecting a project.
- `plan-completion-outlook`: Project dates are filtered summaries of the global schedule, not alternate schedules.

## Impact

- Companion API change: `tacticus-planner-api/openspec/changes/establish-global-goal-priority`; apply API first.
- Affects goal/project data hooks, Goals navigation/detail, Dailies, Insights, farming calculators, onboarding tour, translations, and all callers of project priority.
- Reconcile with `make-global-plan-the-goals-landing`, `improve-bulk-project-membership`, and `surface-goal-farming-guidance` before applying those changes.
