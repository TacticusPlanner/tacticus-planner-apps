## Context

The account-wide order (`global-goal-priority`) is saved with `PUT /api/v1/goals/order { goalIds, expectedRevision }` and rejected as stale when the revision moved. Row-menu moves live in `features/goal-planning/model/goal-order/` (`menu-moves.ts`, `use-goal-order-actions.ts`).

## Decisions

1. **Pure block move.** `moveProjectGoals(order, movedIds, placement)` takes the current in-flight order, the moved project's in-flight ids, and `placement`. This change supports only `{ kind: "top" }`: it removes the moved goals and inserts them at index 0, and every other goal keeps its relative order. The `placement` union is kept so `add-move-project-goals-relative` adds `before` and `after` without a new signature. It lives next to `menu-moves.ts` and is tested in isolation.
2. **One request, one undo.** `useMoveProjectGoals` sends the new order with the current revision and keeps the previous order and the revision the response returns. Undo sends the previous order with that revision. A stale rejection on undo shows "The order changed since. Nothing was undone." and changes nothing.
3. **No dialog.** The item commits at once; undo is the safety net. The dialog arrives with Before and After.
4. **Owning slices.** The order logic stays in `features/goal-planning`. The Projects row menu (`features/project-management`) gets an `onMoveGoalsToTop` callback from `pages/goals`, so no feature imports another (#602).
5. **Desktop and mobile.** The row-menu item and the scoped header button behave the same on both. On mobile the header button is icon-only with an accessible name. Tour steps target `[data-testid="project-move-goals"]` (row menu item and header button).
