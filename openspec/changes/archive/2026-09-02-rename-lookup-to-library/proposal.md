## Why

The public reference area is named "Lookup" and uses singular, abbreviated
routes that make it harder to recognize as a browsable game-data library and
produce URLs that do not identify the selected entity. Renaming it now gives
the growing reference area a clear, consistent information architecture before
additional Library pages are implemented and shared links become established.

## What Changes

- Rename the public Lookup navigation section to Library throughout the app,
  including desktop and mobile navigation, headers, breadcrumbs, search,
  browser titles, landing-page links, tours, localization, and relevant
  in-repository documentation.
- Replace the existing Lookup child destinations with the four Library
  collections: Characters, Machines of War, NPCs, and Raid Bosses.
- Replace `/lookup` routes with plural `/library/...` collection routes and
  support a stable selected entity ID as an optional path segment.
- Make collection routes resolve to an available initial entity, keep secondary
  UI state in query parameters, and update selection and clearing actions to
  synchronize the canonical URL.
- **BREAKING** Remove the old `/lookup` routes and the selected-entity query
  parameter rather than retaining compatibility redirects; V2 is
  pre-production and the new routes are the only supported share/bookmark
  format.

## Capabilities

### New Capabilities

- `library-entity-routes`: Canonical Library collection and entity URLs, plus
  route-synchronized entity selection behavior.

### Modified Capabilities

- `app-navigation`: Rename the Lookup section and its child destinations to
  Library, including all shared navigation and header surfaces.

## Impact

- Affects the React Router configuration, Library/Lookup page slice and
  selection hooks, shared app-shell navigation, landing-page links, Joyride
  targets, browser metadata, and route/navigation tests in `apps/web`.
- Updates localized navigation, page, tour, and description copy in every
  supported locale.
- Does not change API contracts, player-data schemas, or infrastructure.
