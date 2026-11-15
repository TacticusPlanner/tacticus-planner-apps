# Proposal

## Why

The deadline post asks for a "Move to top" on all goals of a project, so the deadline goals go ahead of everything else (UserJot [Plan goals against an event or deadline](https://tacticusplanner.userjot.com/board/p/plan-goals-against-an-event-or-deadline)). Today goals move one at a time (`global-goal-priority`).

This is the first, smallest step of the project moves. Placing a project before or after another project follows in `add-move-project-goals-relative`, which turns this action into a Move goals… dialog.

Agreed on 3 Nov (decisions 25 to 29 and 33 to 35 in the planning notes):

- Paused goals move with the project, and their status doesn't change.
- There's no "Move missing goals to top"; moving the whole project replaces it.
- There's no confirmation step, only undo.
- The action lives in the Projects row menu and the scoped Goals header, for any project.
- A goal in two projects moves with whichever project is moved.

## What Changes

- **Move goals to top** moves the project's in-flight goals (Active and Paused) to the top as one block, keeping their relative order, in one `PUT /api/v1/goals/order`. Every other goal keeps its relative order.
- An **Undo** toast restores the previous order only if the order hasn't changed since.
- The action is in the Projects row menu and the scoped Goals header. When `add-project-deadline-fit` shows a miss, its header also shows it.

## Capabilities

### New Capabilities

- `project-goal-moves`: the move to the top, the block-move rule, the undo.

### Modified Capabilities

- `project-management`: the Projects row menu gains Move goals to top.

## Impact

- `features/goal-planning/model/goal-order/` (`moveProjectGoals` pure function, `useMoveProjectGoals`), `features/project-management` (row-menu item), `pages/goals` (scope header button).
- `common` `goals.order.projectMove.*` i18n in en/de/es/fr; Projects tour.
- No API change: `PUT /api/v1/goals/order` already takes the full order with `expectedRevision`. Independent of the other deadline changes and ships first.
