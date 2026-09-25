## Why

The remaining `I18N-01` gap is specific equipment-piece names. Dailies Shops and Library Shops still derive labels from `I_*`/`R_*` IDs despite complete V1 English, German, Spanish, and French translations for the current catalog.

## What Changes

- Add ID-keyed equipment item names in a dedicated `equipmentItems` namespace for every supported locale.
- Resolve specific equipment/relic reward names through the shared shop-reward display path. Use the catalog English name for a missing translation and a readable ID fallback only for an unknown catalog ID.
- Keep generic equipment pools, slot labels, reward identity, icons, quantities, and eligibility unchanged.

## Capabilities

### New Capabilities

- `equipment-item-localization`: Localized display resolution for specific equipment reward IDs across shop surfaces.

### Modified Capabilities

None.

## Impact

Apps translation resources/types, `features/shop-rewards`, Dailies Shops, and Library Shops. No API or catalog projection change.
