## Context

The Edit goal dialog (`features/goal-create/ui/goal-edit/`) renders a Priority select over positions 1 to N. Move to priority… (`pages/goals`, `global-goal-priority`) uses a number field. Both resolve the move the same way, giving the goal the position the target goal holds.

## Decisions

1. **One option model.** `priorityPickerOptions(order, goalsById, currentGoalId)` in `features/goal-planning/model/goal-order/` returns `{ position, goalId, entityType, entityId, goalType, targetLabelKey, isCurrent }[]` for the in-flight order, including goals the filters hide. The target label reuses `goalTargetLabel`, already used for conflict copy.
2. **Component.** `PriorityPicker` in `features/goal-planning/ui/` is a shadcn Command-based combobox in a popover. `features/goal-create` gets it through `features/goal-planning/@x/goal-create.ts`, which already exists for other exports, so no new sibling-feature import path is added.
3. **Search.** It matches the position number exactly, or a case-insensitive substring of the localized unit name or goal type label. Non-matching options are hidden. A typed number that is out of range or matches nothing shows "No matching position".
4. **Desktop and mobile.** Desktop opens a popover under the field. Mobile opens the list full width inside the dialog or sheet, with the search field pinned on top. The Edit goal tour's priority step keeps `[data-testid="goal-edit-priority"]`, now on the picker trigger. It moves first in both step lists, before the target step.
5. **Long lists.** Options are virtualized past 100 rows so accounts with many goals stay responsive.
