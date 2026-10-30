## Why

Feedback asks for V1's one-click goal priority arrows back. In V2, moving a goal up one place takes five clicks (row menu, Edit, Priority, pick a position, Save), and drag can't help once the list is grouped, because a drop across a group boundary is not offered. A goal in the "Unlock" group can't be dragged above one in the "Rank" group without first switching Group off.

## What Changes

- The goal row's "⋯" menu, on desktop and mobile, offers **Move to top**, **Move up** and **Move down** for Active and Paused goals, below Edit. Each item shows only where it has a target: no Move up or Move to top on the first goal, no Move down on the last, and no Move to top where it would equal Move up.
- A menu move steps over the neighbouring in-flight goal in priority order among the rows the current filters show, **ignoring Group**, so it can cross a group boundary. It sends the same single move a drop sends, so hidden goals keep their relative order and conflicts recover the same way.
- After a move the row is highlighted briefly and a polite live region announces its new position ("Moved to priority 4 of 12.").
- New strings `goals.actions.moveToTop` and `goals.actions.movedTo` in en/de/es/fr; the existing unused `moveUp` / `moveDown` strings are reused.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `global-goal-priority`: adds row-menu moves beside drag reordering on the Goals page.

## Impact

- **UI**: `pages/goals/ui/goals-board/` (`goal-row-actions.tsx`, `goal-table-row.tsx`, `goals-list.tsx`, `goals-mobile-cards.tsx`, `goals-page.tsx`).
- **Model**: `features/goal-planning/model/goal-order/menu-moves.ts` (new) and `use-goals-page-reorder.ts`.
- **API**: none; reuses the existing goal-order endpoint through `useGoalOrderActions`.
