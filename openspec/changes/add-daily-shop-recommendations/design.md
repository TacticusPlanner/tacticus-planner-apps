## Context

See `proposal.md` for motivation. Relevant current state:

- **Game-catalog package** (`packages/game-catalog`): a Dexie DB (`game-catalog-storage.ts`,
  `catalogDbVersion = 4`) with one `EntityTable` per key in `servedDatasetKeys` (`dataset-keys.ts`),
  built generically — no per-key store declaration. Sync (`game-catalog-sync.ts`) and API
  (`game-catalog-api.ts`) are fully generic over `servedDatasetKeys` / `datasetPayloadSchemas`.
  `game-catalog.mapper.ts` maps a dataset payload to id-keyed rows (`asArray` for plain-array
  datasets). Schemas live in `schemas/*.ts`, wired into `schemas/dataset-payloads.ts`
  (`datasetPayloadSchemas` + `GameCatalogRecordByKey`) and `record-types.ts`. `queries.ts` exposes
  per-dataset read helpers. The `add-game-events-calendar-dataset` / `integrate-game-events-calendar`
  pair is the direct precedent for adding a dataset end to end.
- **V1 shop logic** (`tacticusplanner/src/fsd/4-entities/shops/`): `shop-resolve.ts`
  — `resolveShopForDay` → `ResolvedShopItem[]` (flattened, goal-tracking), `resolveShopSlotsPermissive`
  → `ResolvedShopSlot[]` (grouped, browsing, unknown locks default to "possibly active"),
  `cronMatchesDay`, `productMatchesPl`, `lockIsActive` / `resolveEventLockId`, `shardRewardEligible`,
  `groupSlotsByRewardType` — plus `mythic-tier.ts` (`plTier`, `hasBlueStarUnit`,
  `computeShopLockContext`, `PL_MEDIUM = 20`, `MAX_LEGENDARY_THRESHOLD = OneBlueStar`,
  `MYTHIC_UNCRAFTABLE_UPGRADES`). Per-shop services wrap those; Rogue Trader has a "penultimate slot"
  quirk (`resolvePenultimateForDay` — `products.at(-2)`, strips conditions) for the Today view and a
  `resolveFullShopForDay` (permissive, all slots) for the browser.
- **V1 recommendation sections** (`tacticusplanner/src/routes/tables/{guild,war,rogue-trader,crusade}-shop-section.tsx`
  - `daily-raids.helpers.ts` `computeMowCounts`): each takes `inProgressMaterials` + `blockedMaterials`
    (`ICharacterUpgradeEstimate[]` — `snowprintId`, `acquiredCount`, `requiredCount`, `countByUnitId`)
    plus MoW `componentsByAlliance` / `forgeBadgeCounts` (`{acquired, required}`) + `*NeededBy` lists,
    filters `resolveShopForDay(...)` to the reward types it cares about, keeps `acquired < required`,
    groups guaranteed/possible (`groupByAvailability`), renders a card per item.
- **V1 browser** (`tacticusplanner/src/fsd/1-pages/learn-daily-shops/daily-shops-lookup.tsx`): route
  handle `section: 'Library'`, `path: 'learn/daily-shops'`. Day-of-week selector (default `todayDow`),
  per-shop tabs, `resolveShopSlotsPermissive` / `resolveFullShopForDay` per (day, shop), a
  `ShopSlotCard` that renders single-item slots directly and multi-item slots as an "N possible
  rewards" card opening a `Modal`. Uses `rewardInfo` / `summarizeSlotItems` from
  `3-features/shop-rewards` for arbitrary-reward-type icon + label, and `getShopCurrencyIconKey`.
- **V2 Dailies** (`apps/web/src/fsd/pages/dailies`): `route.tsx` maps `shops` (+ 4 others) to
  `DailiesPlaceholderPage`. `DailiesLayout` computes `projectId = selected ?? active ?? default` and
  passes it via `DailiesOutletContext`. `TodayPage` reads `useOutletContext<DailiesOutletContext>()` +
  `useDailyRaids(projectId)`, using `RaidState` for its states and `today.tutorial.tsx` for its tour.
- **V2 Library** (`apps/web/src/fsd/pages/library`): the whole section is **anonymous-available**
  (`nav-items.ts` `anonymousAllowed: true`). `route.tsx` is a flat `RouteObject[]` spliced under
  `/library`; collections are entity routes (`/{collection}` + `/{collection}/:entityId`,
  `library-entity-routes` spec). `LibraryPage` is just an `<Outlet/>`; child tabs render via the
  shared `SectionTabs` row driven by `nav-items.ts`'s Library `children` (currently four). The
  `library` i18n namespace already exists and is preloaded.
- **V2 goal needs**: `useDailyRaids` → `calculateDailyRaids` produces a _schedule-centric_ view model
  (`resourceProgressByDay`, `resourceLabels`, `resourceVisuals`, `goalsById`) covering only
  campaign-farmable resources on the plan. The `goal-farming` feature (`features/goal-farming/lib`)
  computes per-goal estimates including `Blocked` outcomes — it knows every need, farmable or not.
  Player power level is `playerDetailsSchema.powerLevel` in `packages/player-data`; per-unit
  stars/rank come from `getPlayerCharacter` / `getPlayerMow`.
- This workspace's `tp-reimplement-v1-page` skill is the prescribed process for a V1 lookup page →
  V2 Library page migration (dedicated game-data i18n namespaces, id-based icons, correct auth
  boundary, tests) — the `/library/shops` page is exactly that.

## Goals / Non-Goals

**Goals:**

- Land `shops` as a client dataset with no new pipeline pattern (dataset key + schema + record type +
  `catalogDbVersion` bump + plain-array mapper entry + queries), matching the events-calendar
  precedent.
- Port V1's shop resolution faithfully into the package as one module with both forms — the
  goal-tracking `resolveShopOffersForToday` and the permissive `resolveShopSlotsForDay` — sharing the
  day/PL/lock primitives.
- Build one project-scoped aggregate-need selector that covers non-farmable needs and is the single
  surface the recommendations page matches offers against.
- Ship two pages off the one data layer: the authenticated recommendations page under Dailies and the
  public browser under Library, matching V1's behavior for each (minus the recommendations page's
  view-settings toggles).

**Non-Goals:**

- Any backend work — the `shops` served dataset is the mirrored `tacticus-planner-api` change.
- Character-shard shop offers as Unlock/Ascend goal acquisition sources — the store shape supports it
  (structured `unitId`/currency/amount/days/cap per shard variant) but wiring it into goal config is
  a later change.
- Shop events (Armageddon / seasonal) — separate V1 page, separate future change.
- Making `/library/shops` an entity-collection route — it has no per-entity selection, so it stays
  outside the `library-entity-routes` contract.
- Porting V1's `hideRandomShopDeals` / `showGuildShop` view settings.
- A power-level input or roster-aware filtering on the public Library browser — it renders every
  offer for a day (permissive), like V1's page does for a signed-out user.

## Decisions

**1. `shops` is a plain-array dataset, one stored row per shop.**
`dataset-keys.ts` gains `"shops"`; `schemas/shops.ts` defines the shop record schema (slots →
variants → structured reward/cost/days/conditions, matching the API served shape);
`datasetPayloadSchemas.shops = z.array(shopSchema)`; `record-types.ts` adds `GameCatalogShop`;
`game-catalog.mapper.ts` maps `shops: asArray`. The Dexie store is picked up automatically from
`servedDatasetKeys` — the only storage edit is bumping `catalogDbVersion` to 5 and adding a
`.version(5).stores({...})` block with the full store list (per the file's documented version-cascade
convention). This satisfies the issue's "store each shop as a separate record" explicitly.

- _Alternative considered_: a single combined `shops` record. Rejected — the issue calls for per-shop
  records, and per-shop rows let a future consumer read just one shop.

**2. Shop resolution is ported into the package as a pure module with two entry points, not
re-derived.**
New `packages/game-catalog/src/shops/shop-resolve.ts` ports `cronMatchesDay` (now a trivial
`includes` over the pre-reduced `days` array), `productMatchesPl`, `lockIsActive` /
`resolveEventLockId`, `shardRewardEligible`, `groupSlotsByRewardType`, and the `mythic-tier.ts`
helpers, with the lockId branch list and fallbacks copied verbatim from V1. Public entry points:

- `resolveShopOffersForToday(shop, { day, powerLevel, lockContext })` → `ResolvedShopOffer[]`
  (flattened, `isGuaranteed` per offer) — the goal-tracking form, for the recommendations page.
- `resolveShopSlotsForDay(shop, day, { powerLevel?, lockContext? })` → `ResolvedShopSlot[]` (grouped,
  every option per slot, permissive lock handling, context optional) — the browsing form, for the
  Library page.
  V1's `shop-resolve.spec.ts` ports alongside covering both.
- Rogue Trader's "penultimate slot" quirk stays in the _recommendations_ page's RT model (V1
  `rogue-trader.service.ts` `resolvePenultimateForDay`), not the generic resolver — it is a
  presentation choice specific to the Today-style view. The Library browser shows _all_ RT slots via
  `resolveShopSlotsForDay`, matching V1's `resolveFullShopForDay`.

**3. One project-scoped aggregate-need selector, derived from `goal-farming`'s per-goal need calc.**
New selector, in `pages/dailies/model` (it is Dailies-only — the Library browser does not use it) →
for the selected project's `Active` goals, an aggregate keyed by reward resource of
`{ acquired, required, neededBy: [{ unitId, unitName, count }] }`. It derives each goal's need from
`goal-farming`'s `calculateGoalResourceNeed` (Unlock/Ascension shard + mythic-shard totals) plus the
rank/ability material needs (for the `upgHpM00x` ids), **not** from `useDailyRaids`'s campaign-farm
schedule — so count-only / non-farmable needs still appear.

Keyed resources are limited to what that calc produces today: `shards_<id>`, `mythicShards_<id>`, and
the four mythic uncraftable upgrade ids `upgHpM001`..`upgHpM004`. **Forge badges
(`itemAscensionResource_<Rarity>`) and MoW component / component-token needs are out of scope** — V2's
goal model has no need derivation for them (unlike V1's `computeMowCounts` / forge-badge estimate
path). Adding those need models, and then matching the war/crusade shops' forge-badge and component
offers against them, is a separate follow-up (TacticusPlanner/tacticus-planner-apps#104). The four resolvers
still evaluate every shop; offers whose reward type is outside the keyed set simply never match a need
and aren't shown.

- _Alternative considered_: reuse `useDailyRaids`'s `resourceProgressByDay`. Rejected — schedule-scoped,
  omits the count-only needs V1's shop sections rely on.

**4. The recommendations page reuses the Dailies `DailiesOutletContext` project.**
`shops-page.tsx` reads `useOutletContext<DailiesOutletContext>()` for `projectId` /
`projectsUnavailable` / `projectsError` / `retryProjects`, exactly like `TodayPage`. V2's Today is
already project-scoped via this context; a separate selector would be a surprise.

**5. Route wiring.**
Dailies `route.tsx`: drop `"shops"` from the placeholder `.map(...)` and add
`{ path: "shops", element: <ShopsPage /> }` (lazy). Library `route.tsx`: add
`{ path: "shops", element: <ShopsBrowsePage /> }` (lazy) alongside the collection routes — no
`:entityId` variant. These are the only route changes.

**6. The Library browser is public and roster-free.**
Library is anonymous-available, so `/library/shops` must render with no player data. It calls
`resolveShopSlotsForDay(shop, day)` with **no** power-level and **no** lock context, so every slot for
the day shows and roster-dependent locks resolve permissively — the same result V1's page gives a
signed-out user. No PL input this round (a possible later refinement). This is the key auth-boundary
difference from the Dailies recommendations page, which is behind the signed-in Dailies boundary and
needs the roster for `computeShopLockContext` + the goal-need aggregate.

**7. Navigation: a fifth Library child.**
`nav-items.ts` gains `library:collections.shops.label` / `.description` in the `NavLabelKey` /
`NavDescriptionKey` unions and a fifth entry in the Library `children` array (`path:
"/library/shops"`). `SectionTabs` renders it automatically. `library-entity-routes` is untouched
(the new route is not a collection). This is what the `app-navigation` MODIFIED requirement captures.

**8. Desktop/mobile split as separate subviews, on both pages.**
Following the Dailies/Library convention and the events-calendar precedent: `ui/.../desktop/` and
`ui/.../mobile/` subviews branched by `useIsMobile()`. Recommendations desktop = multi-column card
grid per shop section; mobile = dense stacked rows. Browser desktop = multi-column slot-card grid
under the day/shop controls; mobile = single-column with compact controls. Each page computes its
card/slot model once in `model/`, rendered by both subviews.

**9. i18n + icons.**
Recommendations page: new `shops` namespace (`public/locales/{en,de,es,fr}/shops.json`) — shop
names, currency labels, card copy, group headers, the four page states, `tour.shops.steps.*`;
registered in `i18next.d.ts`; `shops-translations.test.ts` key-parity test. Library browser: add its
copy (day labels, "N possible rewards", "nothing available on this day", `tour.libraryShops.steps.*`)
and `collections.shops.label` / `.description` to the existing `library` namespace across all
locales. Shared: an id-based reward icon+label helper (V2 equivalent of V1's `rewardInfo` /
`summarizeSlotItems`) — unit shard icon via `unitId`, upgrade-material icon via upgrade id,
forge-badge icon via rarity, component icon via alliance, currency icon per shop — reused by both
pages' cards, built on the shared `EntityIcon` / game-catalog icon helpers.

## Risks / Trade-offs

- [Risk] Parity drift porting V1's resolver + lock vocabulary. → Mitigation: port V1's
  `shop-resolve.spec.ts` cases verbatim for both resolver forms; keep the lockId branch list
  identical; add a parity note in the module pointing at the V1 source revision.
- [Risk] The aggregate-need selector won't reproduce V1's full `inProgressMaterials +
blockedMaterials` reward coverage — V1's shop sections also match forge badges and MoW components,
  which V2's goal model can't derive a need for yet. → Mitigation: scope this change's matching to the
  three reward categories `calculateGoalResourceNeed` (+ rank/ability material needs) already produces
  — character shards, mythic shards, `upgHpM00x` — matching on `acquired < required` per resource;
  file the forge-badge / MoW-component need model + its shop matching as a separate follow-up (TacticusPlanner/tacticus-planner-apps#104).
  The Library browser is unaffected (it lists every slot regardless of need).
- [Risk] `catalogDbVersion` bump mid-sync on an in-flight client. → Mitigation: the package's
  documented, already-exercised version-cascade path; the new `stores()` block only _adds_ a store,
  no data migration.
- [Risk] Rogue Trader "penultimate slot" is a fragile V1 heuristic (index from the end). →
  Mitigation: isolate it in one commented spot in the recommendations RT model, referencing V1's
  `rogue-trader.service.ts`; the Library browser sidesteps it by showing all slots.
- [Risk] The Library browser being roster-free means its results can differ from what a specific
  signed-in player would actually see (roster/PL locks not applied). → Mitigation: this matches V1's
  own signed-out behavior and the page is explicitly a "what _can_ a shop offer on this day"
  reference, not a personalized view; the permissive resolver's "show when unsure" default is the
  intended semantics.
- [Trade-off] No shop toggles / no PL input on the browser this round (per the issue's "initial
  implementation" framing). Both are additive later.
- [Risk] Backend dependency: both pages are dead until `tacticus-planner-api`'s mirrored change ships
  and the client re-syncs. → Mitigation: the two changes share a name and are archived together only
  once the integration is verified end to end; until then develop/test against a local API build
  carrying the new dataset.

## Migration Plan

Additive on the client: new dataset key, new store version, two new pages, a new namespace + new keys
in an existing one, one fifth nav child. Dailies `route.tsx` swaps one placeholder mapping for the
real page; Library `route.tsx` gains one route. No auth changes to existing pages, no
`library-entity-routes` change, no other-page changes. Rollback is a plain revert (the `shops` store
goes unused; a later `catalogDbVersion` bump supersedes it). Ship after — or together with — the
backend `shops` dataset; verify both pages against real synced `shops` data before archiving either
side.

## Open Questions

- Whether the Dailies recommendations page renders its own inline project-selector row (like Raids) or
  relies on the project selected elsewhere in the Dailies area. Layout detail; does not affect the
  data model, recommendation logic, or task breakdown.
- Whether the Library browser's shop selector is a tab row (V1) or a segmented control / dropdown on
  mobile. Presentation detail; settle during implementation against the current Library shell.
