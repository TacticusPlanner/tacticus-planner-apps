## Context

`add-move-project-goals` adds `moveProjectGoals(order, movedIds, placement)` with `{ kind: "top" }`, `useMoveProjectGoals` with undo, and the row menu and header entry points.

## Decisions

1. **Before and after.** `placement` gains `{ kind: "before" | "after"; referenceIds }`:
   - Remove every moved goal that is not also in the reference project.
   - For before, insert the block at the index of the first remaining reference goal. For after, insert it just after the last remaining reference goal.
   - Every other goal keeps its relative order.
2. **Reference projects offered.** These are the non-archived projects other than the moved one that hold at least one in-flight goal that is not also in the moved project.
3. **Owning slices.** The dialog lives in `features/goal-planning/ui/move-project-goals-dialog.tsx`, and `pages/goals` opens it. The Projects row menu callback is renamed `onMoveGoals`, so no feature imports another (#602).
4. **Desktop and mobile.** The dialog is a centered dialog on desktop and a bottom sheet on mobile, with the same three choices. Use `PortalDialog`-style focus handling so the project select can open inside it. The tour step keeps `[data-testid="project-move-goals"]`.
