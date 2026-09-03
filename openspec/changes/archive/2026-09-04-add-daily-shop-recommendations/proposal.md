## Why

V1 surfaces daily-shop data in two places V2 lacks entirely:

1. **Daily Raids → Today** shows "what should I buy today" _recommendations_ for the four always-on
   daily shops (Guild Shop, Guild War Shop, Rogue Trader, Crusade Shop) — cross-referencing each
   shop's current rotating offers against the player's outstanding goal needs.
2. **Learn → Daily Shops** (`/learn/daily-shops`) is a public _browser_: pick any day of the week and
   see every slot each of the four shops can offer that day, unfiltered by need.

V2 has neither. The Dailies **Shops** tab is a bare "Under Construction" placeholder, there is no
Library equivalent of the browser, and the client game catalog has no shop data at all. This change
adds the shop data layer and both surfaces: a recommendations page under Dailies and a browsing page
under Library. Closes
[TacticusPlanner/tacticus-planner-apps#75](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/75).

## What Changes

- **Backend (separate repo/submodule):** add a `shops` served dataset to the game catalog
  (`TacticusPlanner.GameCatalog`) — the four daily shops, their rotating slots/variants, and
  structured reward/cost/condition/day data. Planned and implemented as the mirrored
  `add-daily-shop-recommendations` OpenSpec change in `tacticus-planner-api`; this change consumes it.
- Add a `shops` IndexedDB store to the client `game-catalog` package: register the `shops` dataset
  key, add its zod schema and inferred record type, and store **one record per shop** (not all shops
  in one blob) via the existing generic Dexie/dataset-sync pipeline. Bump `catalogDbVersion` with a
  new `.version().stores()` block.
- Port V1's shop **resolution** logic into the client `game-catalog` package (from
  `tacticusplanner/src/fsd/4-entities/shops/`), in two variants:
  - a **goal-tracking** resolver — given a shop, the current day, the player's power level, and
    roster context, returns today's flattened reward offers each tagged guaranteed-vs-random
    (V1's `resolveShopForDay`), used by the recommendations page;
  - a **permissive browsing** resolver — given a shop and any day, returns that day's slots with
    every reward option per slot grouped together, treating unresolved roster/lock conditions as
    "possibly available" (V1's `resolveShopSlotsPermissive` / Rogue Trader's `resolveFullShopForDay`),
    used by the Library browsing page.
    Both include the `lockId` resolver (`shop-resolve.ts` / `mythic-tier.ts` equivalents) since lock
    semantics are roster- and time-dependent and the catalog carries `lockId` verbatim.
- Add a **Shops recommendations page** at `/dailies/shops`, replacing the placeholder. For the
  currently-selected Dailies project's active goals, it shows one card per shop offer whose reward the
  player still needs (unmet character-shard, mythic-shard, or mythic uncraftable upgrade-material
  need — the reward categories V2's goal model derives needs for today; forge badges and MoW
  components are a noted follow-up, see below), grouped by shop and by guaranteed-today vs.
  possible-today, each card showing
  the reward, per-unit cost, remaining total cost, and which goals need it. Reuses the Dailies project
  selector (defaulting to the player's Active project, falling back to Default). Desktop and mobile
  get distinct layouts.
- Add a **Shops browsing page** at `/library/shops`, the V2 equivalent of V1's `learn/daily-shops`:
  a public (anonymous-available) reference view with a day-of-week selector (defaulting to the current
  UTC day) and per-shop tabs; for the selected day and shop it lists every slot the shop can offer
  that day, unfiltered by any goal or roster, with multi-reward random slots shown as an expandable
  "N possible rewards" card. It uses the permissive resolver with no power-level filter and an empty
  lock context (no signed-in roster required). Desktop and mobile get distinct layouts. Follow the
  `tp-reimplement-v1-page` skill for this V1→V2 lookup-page migration.
- Add "Shops" as a fifth **Library** child destination in the public navigation, at `/library/shops`.
  (`/library/shops` is a standalone reference route, not an entity-collection route — it has no
  `/{collection}/{entityId}` selection semantics, so `library-entity-routes` is unaffected.)
- Add a shared selector that aggregates, across the selected project's active goals, the outstanding
  need per reward resource with acquired vs. required counts and a per-goal-unit breakdown — the
  surface the recommendations page matches shop offers against. Derived from the `goal-farming`
  feature's per-goal resource-need calc (`calculateGoalResourceNeed` + rank/ability material needs),
  not the daily-raid schedule, so count-only / non-farmable needs are included. It is limited to the
  reward categories that calc produces today: character shards, mythic character shards, and the four
  mythic uncraftable upgrade materials (`upgHpM001`..`upgHpM004`). Forge badges
  (`itemAscensionResource_<Rarity>`) and machine-of-war component / component-token needs are **not**
  matched by this change — V2's goal model has no need derivation for them yet — and are tracked as a
  separate follow-up issue (TacticusPlanner/tacticus-planner-apps#104).
- **No shop enable/disable settings.** On the recommendations page, all four shops' applicable
  recommendations are always shown; both guaranteed and random-slot offers are shown. (V1's
  `showGuildShop` / `hideRandomShopDeals` view settings are deliberately not ported.)
- Add a `shops` i18n namespace (recommendations-page copy: shop names, currency labels, card copy,
  empty/loading/error states) across every supported locale; add `library:collections.shops.*` label
  and description keys and the browsing page's own copy to the existing `library` namespace; add
  id-based icon mapping for shop currencies and reward types; add a Joyride tutorial for each new page
  (desktop + mobile steps) with its `tour.*.steps.*` keys.
- Shop **events** (Armageddon / seasonal event shops — a separate V1 page) are out of scope for both
  pages.
- The future use of character-shard shop offers as acquisition sources for Unlock/Ascend goals is
  out of scope; the `shops` store shape (structured `unitId`, currency, amount, cadence, cap on every
  shard offer) is designed so that integration lands later without a redesign.

## Capabilities

### New Capabilities

- `game-shops-catalog`: the client game-catalog package's shop data layer — the `shops` dataset key,
  its schema/record type and one-record-per-shop store, and the ported resolution (both the
  goal-tracking "today's offers" form and the permissive "any day, all offers" browsing form).
- `daily-shop-recommendations`: the Dailies **Shops** page — matching resolved shop offers against a
  project's outstanding goal needs, the guaranteed/possible grouping, per-card cost and needed-by
  detail, the desktop/mobile presentations, empty/loading/error states, and tutorial.
- `library-shops`: the public Library **Shops** browsing page — day-of-week and per-shop selection,
  the full per-day slot listing with random-slot handling, its states, desktop/mobile presentations,
  and tutorial.

### Modified Capabilities

- `dailies-navigation`: the Shops primary tab SHALL render the Shops recommendations page rather than
  the shared "Under Construction" placeholder.
- `app-navigation`: the public Library section SHALL include a fifth child destination, "Shops", at
  `/library/shops`, consistently across navigation surfaces and contextual labels.

## Impact

- **Backend** (`tacticus-planner-api`, `TacticusPlanner.GameCatalog`): new `shops` served dataset —
  planned/implemented as that repo's own mirrored `add-daily-shop-recommendations` change; this
  change does not edit backend code.
- **Client package** (`packages/game-catalog`): `dataset-keys.ts` (`shops`), `schemas/*.ts` +
  `schemas/dataset-payloads.ts` + `record-types.ts` (shop schema/record), `game-catalog-storage.ts`
  (`catalogDbVersion` bump + new `.version().stores()` block; the store is picked up generically from
  `servedDatasetKeys`), `game-catalog.mapper.ts` (shops is a plain-array passthrough), new `queries.ts`
  selectors, and the ported shop-resolution module (both resolver forms) + its unit tests.
- **Client UI — Dailies** (`apps/web/src/fsd/pages/dailies`): new `ui/shops-page.tsx` (+ desktop/mobile
  subviews), `ui/shops-page.tutorial.tsx`, `model/` selectors for offer↔need matching; `route.tsx`
  maps `shops` to the new page instead of `DailiesPlaceholderPage`.
- **Client UI — Library** (`apps/web/src/fsd/pages/library`): new `ui/shops/` page (+ desktop/mobile
  subviews), its tutorial, `model/` for day/shop state and permissive resolution; `route.tsx` adds
  `{ path: "shops", element: <ShopsBrowsePage /> }`.
- **Navigation** (`apps/web/src/fsd/app/layout/nav-items.ts`): add the `library:collections.shops.*`
  label/description keys to the `NavLabelKey`/`NavDescriptionKey` unions and a fifth entry to the
  Library `children` array; `SectionTabs` picks it up automatically.
- **Shared** (`apps/web/src/fsd/features/goal-farming` or `pages/dailies/model`): a new
  project-scoped aggregate-goal-need selector, reused by the recommendations page.
- **i18n / icons**: new `apps/web/public/locales/{en,de,es,fr}/shops.json` + `i18next.d.ts`
  registration + key-parity test; new keys in `apps/web/public/locales/{en,de,es,fr}/library.json`;
  id-based icon mapping for shop currencies/reward types.
- **No impact** to the authentication boundary of existing pages (the Dailies page stays signed-in;
  the Library page is anonymous like the rest of Library), to `library-entity-routes` (the new route
  is not an entity collection), to V1, or to other pages.
