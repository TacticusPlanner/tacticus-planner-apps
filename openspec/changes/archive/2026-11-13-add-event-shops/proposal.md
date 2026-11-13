## Why

Seasonal event shops (Armageddon Shop and successors) are the 4th most used V1 workflow — 31.9% of wave-1 survey respondents, 46.2% of heavy/power users — and V2 has no equivalent (#24). V1's page also has a known weakness: its shopping list shows every day of the event alike, ignores what was already bought, and its totals and "Missing resources" coverage count past, unbought items as still coming (#508).

This is the frontend half of the paired change `add-event-shops`; the companion `tacticus-planner-api` change of the same name serves the `event-shops` catalog dataset and the `/event-shop-plans` endpoints, and applies first.

## What Changes

- Sync and store the new `event-shops` catalog dataset in `@workspace/game-catalog`, with helpers that map an event day to its date and day of week and resolve a week's slots for that day through the existing shop resolver.
- New **Dailies › Event shop** page (`/dailies/event-shop`, `/dailies/event-shop/:eventId`), reimplementing V1's `plan/shop-events` to the final Claude Design canvas ("Event shop page: directions", FINAL boards):
  - header with event picker, status, local shop reset time and last sync,
  - Shop tab with a week calendar showing each day's planned items (desktop, tablet) or day chips (phone), and slot cards (desktop, tablet) or tiles with a "bought" tick (phone), each showing the one offer the player's tier and roster get,
  - cart and purchases: quantity, "Mark N bought", "Bought fewer…", draft alliance choice; a bottom sheet on phone,
  - read-only milestones, progress chests and missions in the game's own words,
  - a "Search the shop" field over every reward the event sells,
  - coverage of goal needs: still needed, full-price estimate in event currency, "N short" when the event can't cover it,
  - three forms: desktop side column, tablet list drawer, phone tabs Shop · Plan · Rewards.
- Reworked **shopping list** (#508): three totals and the cart total, Needs review (Bought · Bought some… · Missed), Today with "All of today bought", Done, Upcoming/All, real dates on every row, a ⋯ menu per row, Clear week that drops everything not bought and keeps every bought pack, and an ended-event recap.
- Seasonal mission texts, chain names and game modes generated from the game's language files into a new `eventMissions` namespace.
- Cart and purchases persist through the `/event-shop-plans` API per signed-in account.
- New `eventShops` i18n namespace (en/de/es/fr) and a page tour for desktop, tablet and phone.

## Capabilities

### New Capabilities

- `game-event-shops-catalog`: the `event-shops` dataset in the client catalog package — sync, storage, query, and event-day/date helpers built on the shop resolver.
- `event-shop-planner`: the Dailies › Event shop page — header, day selection, shop slots, cart and purchase tracking, rewards, unit search, coverage, states, tour, desktop/tablet/phone forms.
- `event-shop-shopping-list`: the time- and purchase-aware shopping list and its totals, including the rule that coverage ignores missed days.

### Modified Capabilities

<!-- none: daily shops, Library › Shops and the Today shop recommendations are unchanged -->

## Impact

- `packages/game-catalog`: new dataset key, schema, IndexedDB store (version bump), query and helpers.
- `apps/web/scripts/generate-game-names-i18n.mjs`: new `eventMissions` namespace generated into all four locales.
- `apps/web/src/fsd`: new `entities/event-shop` (API client, queries, plan types), new `features/shops/event-planner` (cart, coverage, shopping-list model), new page UI under `pages/dailies`, nav item and route; reuse of `features/shops/rewards` display, `features/shops/recommendations` need aggregation and `features/goal-planning` missing-resources totals through their public APIs.
- `apps/web/public/locales/{en,de,es,fr}/eventShops.json`, tour keys, typed resources.
- Generated API client from the API's regenerated OpenAPI artifact.
- Companion: `tacticus-planner-api` change `add-event-shops`. Tracks #24 and #508.
