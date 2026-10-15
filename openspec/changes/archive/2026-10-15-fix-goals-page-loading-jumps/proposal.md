## Why

UserJot feedback "Goals page jumps during loading" (post body unavailable): the Goals list visibly shifts while it loads. Investigation found four causes:

1. The default Unfulfilled tab (and Reached) splits rows by attainment, which reads `unknown` (not reached) until each goal's detail and the synced player-data tables load. Reached goals render, then drop out one by one; the loading skeleton only covered the goal list request.
2. A deep link `?project={id}` first lists every goal while the project list loads, then - once the scope is valid but its member list is still in flight - filters every row out and shows the "filters match nothing" line, then fills.
3. The estimates-failed notice and the "no farmable demand" line resolve after the rows and render above them, pushing the list down.
4. On mobile, the reorder and select toggles appear only once goals have loaded, shifting Create Goal and Planning Settings sideways.

## What Changes

- The Goals list holds its loading skeleton until what decides row membership is known: the goal list, a deep-linked scope's project list and member list, and - on Unfulfilled/Reached - every visible goal's attainment. It never shows the filtered-empty line for a scope whose membership is still loading. A failed detail/member request or an unsynced player-data table counts as settled, so the skeleton cannot hang.
- The estimates-failed notice and the no-farmable-demand line render below the list.
- On mobile the reorder-mode and select-mode toggles are always rendered, disabled while goals load or when there is nothing to act on.
- Out of scope: reserving per-row metric slots while plan insights load.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `goal-list-layout`: the list's loading state lasts until row membership is known; late notices sit below the list.
- `goals-navigation`: a deep-linked scope shows the loading state (not all goals) while the project list loads; the mobile reorder toggle is always present, disabled when unavailable.
- `goal-bulk-actions`: the mobile select-mode toggle is always present, disabled when no row is visible.

## Impact

`pages/goals/model/attainment/use-goal-attainment.ts` (new `useGoalAttainmentState` with a `pending` flag), `model/projects/use-goal-projects.ts` (`pendingProjectIds`), `model/projects/use-goals-project-scope.ts` (`requestedProjectId`), `model/goals-data/goals-list-loading.ts` (new), `ui/goals-board/goals-page.tsx`, `goals-estimates-error.tsx` (`GoalsLateNotices`), the two mobile toggles, and their tests. No API, data, or i18n change; no companion `tacticus-planner-api` change.
