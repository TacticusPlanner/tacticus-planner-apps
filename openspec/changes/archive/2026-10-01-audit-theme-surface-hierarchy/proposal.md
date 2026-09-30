## Why

The current dark theme makes cards darker than the canvas and makes navigation markedly darker still; light mode has different risks, including very similar navigation/canvas surfaces and weakly separated controls. Both themes need a coherent, independently evaluated surface hierarchy rather than a copied Azure palette or a mechanical inversion of one theme into the other.

## What Changes

- Audit and correct light and dark surface roles across the app shell, cards, forms, overlays, and interaction states on desktop and mobile.
- In dark mode, use a restrained dark canvas with lighter cards/overlays and integrated navigation. In light mode, retain the useful white-card/off-white-canvas relationship and correct only demonstrated separation/readability issues.
- Separate page-header, navigation, and top-bar roles so reusing sidebar colors does not dictate the whole shell's appearance.
- Measure text/control contrast against actual composited backgrounds, including opacity, hover, focus, selection, and muted text; keep decorative separation distinct from accessibility thresholds.
- Preserve blue primary actions, game/status meanings, theme preference behavior, layouts, and navigation functionality. Azure is a structural reference only; neither theme must match its colors.
- Deliver an evidence-backed before/after audit with per-theme retain/change decisions, color measurements, and representative desktop/mobile screenshots.

## Capabilities

### New Capabilities

- `theme-surface-hierarchy`: coherent light/dark surface roles, readable controls and text, interaction-state separation, and theme consistency across platforms.

### Modified Capabilities

None. Existing `goal-visual-accessibility` requirements remain in force and provide regression criteria; this capability extends shell/shared-surface coverage without replacing goal-specific rules.

## Impact

Apps repo only: `packages/ui/src/styles/globals.css`, shared component styles, app shell surface assignments, and direct token consumers such as Schedule day cards. No API companion, new dependency, authentication change, or data migration.

Keep this change separate from `revamp-desktop-navigation` and `add-navigation-quick-actions`. It can audit current surfaces independently; implement shared styling after the navigation revamp so its top bar and section menu are verified too. Quick actions do not block it, but use the same search-surface tokens if present. No source code is changed during proposal generation.
