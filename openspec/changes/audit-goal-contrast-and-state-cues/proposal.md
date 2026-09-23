## Why

`UI-002` reports difficulty reading dense Goals views. A density option alone cannot fix low-contrast labels, progress states, or color-only status cues across light and dark themes.

## What Changes

- Audit goal rows/cards, detail, semantic badges, progress fills/markers, and dense states in both themes against a defined contrast target.
- Correct failing token/component combinations and ensure goal status and restrictions have text or icon cues in addition to color.
- Preserve existing goal information, interactions, and visual language.

## Capabilities

### New Capabilities

- `goal-visual-accessibility`: Readability and non-color-only state cues on Goals surfaces.

### Modified Capabilities

None.

## Impact

Apps goal UI and shared semantic tokens/components where needed, theme tests, and screenshot/manual checks. No API change.
