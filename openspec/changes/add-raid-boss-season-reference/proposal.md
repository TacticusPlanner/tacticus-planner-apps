## Why

V2's Raid Bosses Library is an entity encyclopedia: it starts on one boss and
finds a representative encounter across all served seasons. V1's Guild Raid
Season reference instead answers the planning question players have first:
which boss and primes appear in each set at each tier of a selected season.
The V2 catalog already serves the rotation and all of that encounter structure,
but the page does not expose it or preserve an encounter context into detail.

## What Changes

- Make `/library/raid-bosses` a season-reference landing view, with a
  query-backed season selector that defaults to the first served rotation entry.
- Render the selected season as a descending rarity-tier board, with each set
  showing its Crystal prime(s) and boss in authored encounter order. Cards use
  V2's resolved names and portrait fallback rather than copying V1's tall boss
  art treatment.
- Let an encounter card open the existing per-entity detail route while
  preserving a validated `season`, `tier`, `set`, and `encounter` context.
  Contextual detail resolves its field enemies, primes, modifiers, adjusted
  values, and initial progression step from that exact encounter; ordinary
  direct entity links keep the existing representative-encounter behavior.
- Retain an all-entities navigation affordance in the detail experience. This
  change integrates with the separately planned mobile grouped picker and does
  not duplicate its implementation.
- Update desktop and mobile tours, localized copy, automated coverage, and
  live verification for the season-board flow.

No API contract change is needed: the existing `raid-bosses` payload already
contains `seasonConfigRotation`, seasons, tiers, sets, and encounters. The
rotation has no time-based live-season signal, so this change calls the first
rotation entry the default season, not the currently live season.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `raid-boss-library`: replace the bare-route entity canonicalization with the
  season-reference landing experience, define the tier/set board on both
  platforms, and require contextual detail views to use their selected exact
  encounter while preserving direct-link fallback behavior.

## Impact

- `apps/web/src/fsd/entities/raid-boss/`: pure, reusable season-board and
  encounter-context resolvers, exported through the entity public API.
- `apps/web/src/fsd/pages/library/ui/raid-bosses/`: route/query-state handling,
  season board, desktop/mobile presentation, detail-context plumbing, and tour.
- `apps/web/public/locales/{en,de,es,fr}/library.json`: season, tier, set,
  navigation, empty-state, and tour copy.
- Existing `raid-boss-library` tests plus new entity and page tests.
- No companion `tacticus-planner-api` change; the API already serves the needed
  structure and its tests assert rotation preservation.
