# Proposal

## Why

Severyn wants to place a project's goals before or after another project's, not only at the top (3 Nov). `add-move-project-goals` ships Move goals to top first, as a one-click action. This change extends it.

Agreed on 3 Nov (decisions 33 to 35 in the planning notes):

- A goal in two projects moves with whichever project is moved, and stays put when it is in both the moved and the reference project.
- "Before X" means just above X's first in-flight goal, and "after X" just below X's last.
- One small dialog covers the top, before and after.

## What Changes

- Move goals to top becomes **Move goals…**, a dialog with **To the top**, **Before** a project, or **After** a project, with a project select.
- The block rule, the single order update and the undo stay as `add-move-project-goals` defines them.
- On mobile the dialog is a bottom sheet.

## Capabilities

### Modified Capabilities

- `project-goal-moves`: the action opens a dialog with Before and After; the shared-goal and reference-list rules.
- `project-management`: the row menu item is renamed Move goals….

## Impact

- `features/goal-planning/model/goal-order/` (`moveProjectGoals` gains `before` and `after`), `features/goal-planning/ui/move-project-goals-dialog.tsx`, `pages/goals` (opens the dialog from the row menu callback and the header).
- `common` `goals.order.projectMove.*` keys for the dialog in en/de/es/fr; the Projects tour step text.
- No API change. Depends on `add-move-project-goals`, which must be archived first.
