## Why

Feedback: the goal row menu cuts off "Remove from this project" at "Remove from this", because every dropdown menu is as wide as its trigger (8rem minimum) and the "⋯" trigger is icon-sized. Separately, moving a goal several places takes many Move up / Move down clicks or a drag; the owner wants to type the target priority directly.

## What Changes

- Shared `DropdownMenuContent` sizes to its content (at least its trigger and 8rem wide, at most the space available), so long items are no longer clipped in any menu.
- The goal row's "⋯" menu, on desktop and mobile, adds **Move to priority…** after the other priority moves for Active and Paused goals whenever at least two goals hold a position. It opens a small dialog with one number field (1 to the number of in-flight goals), prefilled with the goal's current priority. Move is enabled only for a whole number in range that differs from the current priority, and commits the same single move the other menu moves send (highlight + announcement included).
- The number is the account-wide priority shown on the row, so it counts goals the filters hide; the item is offered even when the filters show only that goal.
- New strings `goals.actions.moveToPriority*` in en/de/es/fr.

## Capabilities

### Modified Capabilities

- `global-goal-priority`: adds Move to priority to the row-menu moves.

## Impact

- **UI**: `packages/ui` `dropdown-menu.tsx`; `pages/goals/ui/goals-board/` (`goal-row-actions.tsx`, new `move-to-priority-dialog.tsx`, `goal-table-row.tsx` memo comparator, `goals-page.tsx`).
- **Model**: `features/goal-planning/model/goal-order/menu-moves.ts` (`priorityOrder`, `displacedForPriority`) and `use-goals-page-reorder.ts`.
- **API**: none.
