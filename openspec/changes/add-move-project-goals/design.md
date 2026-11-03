## Context

The account-wide order (`global-goal-priority`) is saved with `PUT /api/v1/goals/order { goalIds, expectedRevision }` and rejected as stale when the revision moved. Row-menu moves live in `features/goal-planning/model/goal-order/` (`menu-moves.ts`, `use-goal-order-actions.ts`).

## Decisions

1. **Pure block move.** `moveProjectGoals(order, movedIds, placement)` takes the current in-flight order, the moved project's in-flight ids, and `placement` (`{ kind: "top" } | { kind: "before" | "after"; referenceIds }`), and returns the new order:
   - Remove every moved goal that is not also in the reference project.
   - For top, insert the block at index 0. For before, insert it at the index of the first remaining reference goal. For after, insert it just after the last remaining reference goal.
   - Every other goal keeps its relative order.
     It lives next to `menu-moves.ts` and is tested in isolation.
2. **One request, one undo.** `useMoveProjectGoals` sends the new order with the current revision and keeps the previous order and the revision the response returns. Undo sends the previous order with that revision. A stale rejection on undo shows "The order changed since. Nothing was undone." and changes nothing.
3. **Reference projects offered.** These are the non-archived projects other than the moved one that hold at least one in-flight goal that is not also in the moved project.
4. **Owning slices.** The order logic stays in `features/goal-planning`. The dialog lives in `features/goal-planning/ui/move-project-goals-dialog.tsx`, and pages open it. The Projects row menu (`features/project-management`) gets an `onMoveGoals` callback from `pages/goals`, so no feature imports another.
5. **Desktop and mobile.** The dialog is a centered dialog on desktop and a bottom sheet on mobile, with the same three choices. Use `PortalDialog`-style focus handling so the project select can open inside it. Tour steps target `[data-testid="project-move-goals"]` (row menu item and header button) on both forms.
