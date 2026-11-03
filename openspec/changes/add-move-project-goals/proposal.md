# Proposal

## Why

The deadline post asks for a "Move to top" on all goals of a project, so the deadline goals go ahead of everything else (UserJot [Plan goals against an event or deadline](https://tacticusplanner.userjot.com/board/p/plan-goals-against-an-event-or-deadline)). Severyn also wants to place a project's goals before or after another project's, not only at the top (3 Nov). Today goals move one at a time (`global-goal-priority`).

Agreed on 3 Nov (decisions 25 to 29 and 33 to 35 in the planning notes):

- Paused goals move with the project, and their status doesn't change.
- There's no "Move missing goals to top"; moving the whole project replaces it.
- There's no confirmation step, only undo.
- The action lives in the Projects row menu and the scoped Goals header, for any project.
- A goal in two projects moves with whichever project is moved, and stays put when it is in both the moved and the reference project.
- "Before X" means just above X's first in-flight goal, and "after X" just below X's last.
- One small dialog covers the top, before and after.

## What Changes

- A **Move goals…** dialog offers **To the top**, **Before** a project, or **After** a project, with a project select.
- It moves the project's in-flight goals (Active and Paused) as one block, keeping their relative order, in one `PUT /api/v1/goals/order`. Every other goal keeps its relative order.
- An **Undo** toast restores the previous order only if the order hasn't changed since.
- The dialog opens from the Projects row menu and the scoped Goals header. When `add-project-deadline-fit` shows a miss, its header also shows the button.

## Capabilities

### New Capabilities

- `project-goal-moves`: the dialog, the block-move rule, the undo.

### Modified Capabilities

- `project-management`: the Projects row menu gains Move goals….

## Impact

- `features/goal-planning/model/goal-order/` (`moveProjectGoals` pure function, `useMoveProjectGoals`), `features/project-management` (row-menu item), `pages/goals` (scope header button, dialog).
- `common` `goals.order.projectMove.*` i18n in en/de/es/fr; Projects and Goals tours.
- No API change: `PUT /api/v1/goals/order` already takes the full order with `expectedRevision`. Independent of the other deadline changes and can ship first.
