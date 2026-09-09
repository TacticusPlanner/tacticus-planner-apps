## Why

The client can already sync game-catalog data for Guild Raid Boss details, but
it has no typed, reactive source for curated Meta recommendations or Comp
guidance. The Library needs that source to render strategy information from
stable ids rather than duplicate editorial data in UI components.

## What Changes

- Add `guild-raid-meta` to the game-catalog client's manifest sync, schema
  validation, IndexedDB storage, and query surface.
- Expose typed Meta recommendations, Comp profiles, evidence metadata, and
  source/update identifiers to consuming features.
- Resolve heroes, Machines of War, boss names, Comp signature icons, and source
  presentation from existing client catalog/i18n data; the served API data
  remains id-only.
- Add validation and migration tests for missing or malformed synced data.

## Capabilities

### New Capabilities

- `guild-raid-meta-catalog`: Gives client features a synced, validated,
  id-resolved query surface for curated Guild Raid Boss Meta and Comp data.

### Modified Capabilities

_None._

## Impact

- `packages/game-catalog`: dataset schema, manifest sync, Dexie version/store,
  mapper, and query exports.
- `apps/web`: shared entity-level Meta/Comp presentation resolvers, consumed by
  the companion Library-tabs change rather than implemented in this change.
- Companion `add-guild-raid-meta-catalog` change in `tacticus-planner-api`,
  which owns the served dataset and applies first.
