## Why

The current Raid Boss Library is limited to Boss/Prime detail even though its
synced catalog already contains season configurations, and it gives players no
way to discover strategy recommendations. A single Guild Raid Boss Library
with dedicated Seasons Config, Meta, and Details views makes all of this
information findable without fragmenting navigation.

## What Changes

- Rename the public Library collection from **Raid Boss(es)** to **Guild Raid
  Boss(es)** across navigation, page copy, status states, and tours, with full
  English, German, Spanish, and French translations. Internal routes,
  identifiers, and catalog keys remain unchanged.
- Add URL-backed **Seasons Config**, **Meta**, and **Boss / Prime Details** tabs
  to `/library/raid-bosses`; Details remains the default and preserves the
  existing entity-selection/deep-link behavior.
- Render the existing catalog's season rotation as a selectable configuration
  view of ordered tiers, sets, rewards, and encounters.
- Render synced curated Meta and alternate exact teams for each boss, with
  Comp badges/filtering, evidence/source information, and expandable Comp
  guidance covering core heroes, flex heroes, and suitable Machines of War.
- Update responsive layouts, loading/absent states, onboarding tours, and tests;
  coordinate the layout with the already-planned mobile picker and detail-parity
  changes without duplicating their tasks.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `raid-boss-library`: Expands the public Library experience into tabbed Guild
  Raid Boss season, Meta, and Boss/Prime-detail views and renames its public
  terminology.

## Impact

- `apps/web/src/fsd/pages/library/ui/raid-bosses`: page orchestration, routing
  state, desktop/mobile views, tour, and focused tests.
- `apps/web/public/locales/{en,de,es,fr}/library.json`: public terminology and
  new tab, season, Meta, and Comp copy.
- Depends on the apps half of `add-guild-raid-meta-catalog` for typed Meta and
  Comp data; uses the existing `raid-bosses` dataset for season configurations.
- Interacts with, but does not replace, `refine-raid-boss-detail-parity` and
  `add-raid-boss-mobile-picker`.
