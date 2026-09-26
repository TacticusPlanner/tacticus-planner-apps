## Why

`UI-002` reports difficulty reading dense Goals views. A density option alone cannot fix low-contrast labels, progress states, or color-only status cues across light and dark themes. The Goals page also now carries reorder affordances (drag handle, dragging state, mobile reorder mode, order-conflict banner) that add new states to check.

## What Changes

- Audit goal rows/cards, detail, semantic badges, progress fills/markers, and dense states in both themes against a defined contrast target, on the Goals page (`/plan/goals`), Project Detail (`/plan/projects/:projectId`), and goal detail.
- Include the reorder states on those surfaces: the drag handle, a row while dragging, mobile reorder mode and its bar, Paused rows in the priority-ordered list, and the order-conflict banner.
- Correct failing token/component combinations and ensure goal status, restrictions, and reorder controls have text or icon cues in addition to color.
- Preserve existing goal information, interactions, and visual language.

## Capabilities

### New Capabilities

- `goal-visual-accessibility`: Readability and non-color-only state cues on Goals surfaces.

### Modified Capabilities

None.

## Impact

Apps goal UI and shared semantic tokens/components where needed, theme tests, and screenshot/manual checks. No API change.

Depends on `consolidate-goals-into-plan-and-remove-active-project` (the merged Goals page and its reorder states) being applied first. Related, and edited by another change: `add-goals-overview-density-option` (a Compact presentation, if it lands, is audited in both densities).
