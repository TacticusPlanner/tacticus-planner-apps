# Tasks

## 1. Moves

- [x] 1.1 Add `goalMenuMoves` (`features/goal-planning/model/goal-order/menu-moves.ts`): per visible in-flight row, the goal Move to top / up / down would displace, Group ignored; verify `menu-moves.test.ts` covers ends, rows without a position and a single goal.
- [x] 1.2 Add `handleMenuMove`, the moved-row highlight and the announced position to `useGoalsPageReorder`.

## 2. UI

- [x] 2.1 Add the move items to `GoalRowActions` and pass each row's moves through `GoalsList`, `GoalRowCells` (memo comparator compares the targets) and `GoalsMobileCards`.
- [x] 2.2 Highlight the moved row and announce its position in a polite live region on the Goals page.
- [x] 2.3 Add `goals.actions.moveToTop` and `goals.actions.movedTo` in en/de/es/fr.
- [x] 2.4 Verify `goal-row-actions.test.tsx` (items per target, the move fired) and `goals-page.reorder.test.tsx` (grouped move crosses a group, filtered move skips hidden goals, announcement).

## 3. Manual

- [ ] 3.1 Desktop and mobile: Move up in a grouped-by-type list changes the priority number and highlights the row; the menu closes and focus returns to its trigger.
