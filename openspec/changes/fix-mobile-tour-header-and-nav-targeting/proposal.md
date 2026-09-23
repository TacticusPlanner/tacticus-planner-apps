## Why

The mobile tour reportedly misplaces its sticky-header step and fixed-bottom-navigation step (`TOUR-01`, `TOUR-03`). Unlike the drawer step, neither waits for an opening animation; the mechanism needs a live viewport check before a positioning fix is selected.

## What Changes

- Reproduce both steps while scrolling, resizing, and revisiting earlier steps on short mobile viewports.
- Correct target selection, measurement, or callout placement where a mismatch is confirmed, preserving step content and existing navigation behavior.
- Keep this separate from `fix-mobile-tour-account-drawer-positioning` unless the reproduced cause and solution are identical.

## Capabilities

### New Capabilities

- `mobile-tour-anchor-stability`: Correct spotlight and callout alignment for sticky and fixed shell targets.

### Modified Capabilities

None.

## Impact

Apps shared shell tour, possibly tour-provider positioning or responsive selectors, and focused tour tests. No API change.
