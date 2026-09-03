## 1. Backend dependency (tacticus-planner-api)

- [x] 1.1 The `shops` served game-catalog dataset is implemented and deployed by the mirrored `add-daily-shop-recommendations` OpenSpec change in `tacticus-planner-api` (see that repo's `openspec/changes/add-daily-shop-recommendations/`). This change does not edit backend code; verify by hitting `GET /api/v1/game-catalog/shops` on the local API build and seeing one record per shop.

## 2. Client game-catalog package: `shops` dataset wiring

- [x] 2.1 Add `"shops"` to `servedDatasetKeys` in `packages/game-catalog/src/dataset-keys.ts`. Verify the package's `game-catalog-sync.test.ts` (which derives its manifest from `servedDatasetKeys`) still passes with the new key.
- [x] 2.2 Add `schemas/shops.ts`: a zod schema for a shop record — `id`, `displayLocation`, `refreshWithAdWatch`, `allowedRefreshesPerDay`, optional `refreshCost` `{resourceType, amount}`, `slots: { variants: ShopVariant[] }[]`, where `ShopVariant` = `{ reward: {type, qty}, unitId?, freeOffer?: {type, qty}, cost: {currency, amount}, maxPurchasesPerDay, weight?, days: DayOfWeek[], minPowerLevel?, maxPowerLevel?, lockId? }`. Verify with a schema unit test (valid record parses; a malformed variant is rejected).
- [x] 2.3 Wire the schema into `schemas/dataset-payloads.ts` (`datasetPayloadSchemas.shops = z.array(shopSchema)` and the `GameCatalogRecordByKey.shops` entry) and add `GameCatalogShop` to `record-types.ts`. Verify `pnpm typecheck` passes in the package.
- [x] 2.4 Add `shops: asArray` to `datasetToStorageModels` in `game-catalog.mapper.ts` (plain-array passthrough; records already carry `id`). Verify with a mapper unit test that a shops payload maps to one row per shop keyed by shop id.
- [x] 2.5 Bump `catalogDbVersion` (4 → 5) in `game-catalog-storage.ts` and add a `.version(5).stores({...})` block listing the full store set including `shops` (the `EntityTable` is picked up generically from `servedDatasetKeys`). Verify with a storage test that an existing v4 database upgrades to v5, the `shops` store exists, and other datasets' rows survive.
- [x] 2.6 Add a `getShops()` / `getShopsMap()` query to `queries.ts`, mirroring the other dataset read helpers. Verify with a unit test.

## 3. Client game-catalog package: shop resolution

- [x] 3.1 Port V1's shop resolution primitives into `packages/game-catalog/src/shops/shop-resolve.ts` (from `tacticusplanner/src/fsd/4-entities/shops/shop-resolve.ts` + `mythic-tier.ts`): day match (over the pre-reduced `days` array), power-level bounds, `lockId` resolution (`lockIsActive` / `resolveEventLockId` branch list copied verbatim, including the unrecognized-lock fallbacks), `shardRewardEligible`, `groupSlotsByRewardType`, and `plTier` / `hasBlueStarUnit` / `computeShopLockContext` / `MYTHIC_UNCRAFTABLE_UPGRADES`. Add a parity comment naming the V1 source revision.
- [x] 3.2 Expose `resolveShopOffersForToday(shop, { day, powerLevel, lockContext })` → `ResolvedShopOffer[]` (flattened; `{ rewardType, unitId?, rewardQty, cost, maxPerDay, freeOfferType?, isGuaranteed }`) — the goal-tracking form. Verify by porting V1's `shop-resolve.spec.ts` goal-tracking cases (day filtering, PL filtering, guaranteed-vs-random grouping, lock resolution).
- [x] 3.3 Expose `resolveShopSlotsForDay(shop, day, { powerLevel?, lockContext? })` → `ResolvedShopSlot[]` (grouped; every reward option per slot; permissive lock handling; context optional) — the browsing form, equivalent to V1's `resolveShopSlotsPermissive` / `resolveFullShopForDay`. Verify by porting V1's permissive cases: a multi-reward slot returned as one group, an arbitrary (non-today) day resolved, no roster context required, an empty result for a day with no slots.
- [x] 3.4 Export both resolvers and their types from the package public API (`index.ts`). Verify `pnpm lint:fsd` / package build passes.

## 4. Shared: project-scoped aggregate goal-need selector

- [x] 4.1 Add a selector in `pages/dailies/model` (Dailies-only — the Library browser does not use it) that, for a project's `Active` goals, returns an aggregate keyed by reward resource of `{ acquired, required, neededBy: [{ unitId, unitName, count }] }`. Keyed resources are the categories V2's goal model derives a need for today: `shards_<id>` and `mythicShards_<id>` (from `goal-farming`'s `calculateGoalResourceNeed` — Unlock/Ascension) and `upgHpM001`..`upgHpM004` (from the rank/ability material needs). Derive from the per-goal need calc, not the daily-raid schedule, so count-only / non-farmable needs are included. Forge badges (`itemAscensionResource_<Rarity>`) and MoW component / component-token needs are **out of scope** (no V2 need model — tracked as TacticusPlanner/tacticus-planner-apps#104). Verify with a unit test covering a shard need, a `upgHpM00x` mythic-upgrade need, and exclusion of Paused/Completed/Archived goals.
- [x] 4.2 If this selector moves logic between FSD slices, add regression tests for existing `goal-farming` consumers and run `pnpm lint:fsd`.

## 5. Dailies Shops recommendations page

- [x] 5.1 Add `apps/web/src/fsd/pages/dailies/ui/shops-page.tsx` reading `useOutletContext<DailiesOutletContext>()` for `projectId` / `projectsUnavailable` / `projectsError` / `retryProjects`, mirroring `today-page.tsx`. Verify it renders under `/dailies/shops`.
- [x] 5.2 In Dailies `route.tsx`, remove `"shops"` from the placeholder `.map(...)` and add `{ path: "shops", element: <ShopsPage /> }` (lazy). Verify direct navigation to `/dailies/shops` shows the page with the Shops tab active (update/extend `dailies-pages.test.tsx`).
- [x] 5.3 Add `model/` logic: read shops via `getShops()`, resolve each with `resolveShopOffersForToday` for the current UTC day + player power level + roster lock context, match resolved offers against the group-4 aggregate need (keyed on `shards_<id>` / `mythicShards_<id>` / `upgHpM00x` only — an offer whose reward type is outside that set never matches and is dropped), keep offers with `acquired < required`, group per shop into guaranteed-today / possible-today. Verify with a unit test (needed reward recommended; not-needed/satisfied reward not recommended; forge-badge / component offer not recommended; random-slot offer marked possible).
- [x] 5.4 Build the desktop subview (`ui/shops/desktop/`, ≥768px): per-shop sections, each with labeled Guaranteed/Possible groups and a multi-column card grid. Each card: reward icon+name, acquired/required, per-purchase currency cost, remaining total cost (hidden when covered), daily-availability note, random indicator, needed-by goal units. Verify with a component test.
- [x] 5.5 Build the mobile subview (`ui/shops/mobile/`, <768px) as dense stacked rows — genuinely distinct from desktop, not a reflow — preserving every label/count/cost/indicator. Branch on `useIsMobile()`. Verify with a component test at a <768px viewport.
- [x] 5.6 Add the four page states via a `RaidState`-style component: loading, page-local load failure (with retry of the failed request), no-project (prompt to create/select), and "nothing to buy today" empty state. Verify each with a test; confirm total catalog-sync failure is still handled by the global gate (not re-handled here).
- [x] 5.7 Isolate Rogue Trader's "penultimate slot" selection (V1 `rogue-trader.service.ts` `resolvePenultimateForDay`) in one commented spot in the RT recommendations model. Verify RT recommendations match V1 for a sample day/roster.

## 6. Library Shops browsing page

> V1 → V2 lookup-page migration — follow the workspace `tp-reimplement-v1-page` skill. Source:
> `tacticusplanner/src/fsd/1-pages/learn-daily-shops/`. This page is **public** (Library is
> anonymous-available) and roster-free.

- [x] 6.1 Add `apps/web/src/fsd/pages/library/ui/shops/shops-browse-page.tsx` — a public page with a day-of-week selector (default current UTC day) and a shop selector (Guild / War / Crusade / Rogue Trader). Verify it renders at `/library/shops` without any auth prompt or player data.
- [x] 6.2 In Library `route.tsx`, add `{ path: "shops", element: <ShopsBrowsePage /> }` (lazy) — no `:entityId` variant. Verify direct navigation to `/library/shops` loads the page with no redirect to a "first entity" URL (extend `library/route.test.tsx`).
- [x] 6.3 Add `model/` logic: read shops via `getShops()`, and for the selected (day, shop) call `resolveShopSlotsForDay(shop, day)` with no power-level and no lock context. Build a slot view model: single-reward slots render directly; multi-reward slots carry a "possible rewards" list. Verify with a unit test (all slots for a day returned; multi-reward slot grouped, not split; a day with no slots yields the empty state).
- [x] 6.4 Build the desktop subview (≥768px): day/shop controls above a multi-column slot-card grid. Each card shows reward(s), per-purchase currency cost, daily availability, bundled free offer; multi-reward slots show "N possible rewards" with the list inline (few) or in an expandable detail (many). Verify with a component test.
- [x] 6.5 Build the mobile subview (<768px) — compact day/shop controls, single-column cards — genuinely distinct from desktop. Branch on `useIsMobile()`. Verify with a component test at a <768px viewport.
- [x] 6.6 Add loading, load-failure (with retry), and per-day "nothing available on this day" empty states. Verify each with a test.
- [x] 6.7 Add the fifth Library nav child in `apps/web/src/fsd/app/layout/nav-items.ts`: `library:collections.shops.label` / `library:collections.shops.description` in the `NavLabelKey` / `NavDescriptionKey` unions, and a `{ path: "/library/shops", labelKey, descriptionKey }` entry in the Library `children` array. Verify `SectionTabs` shows the Shops tab and the desktop/mobile nav and nav-search list it (extend the relevant navigation tests).

## 7. i18n & icons

- [x] 7.1 Add the `shops` i18n namespace `apps/web/public/locales/en/shops.json` for the recommendations page: shop display names, the four currency labels, card copy, Guaranteed/Possible group headers, the four page-state messages. Register its TS resource type in `i18next.d.ts`. Reuse `characters` / `factions` namespaces for unit and alliance names.
- [x] 7.2 Add the browsing page's copy to the existing `library` namespace (`apps/web/public/locales/en/library.json`): `collections.shops.label` / `collections.shops.description`, day-of-week labels (or reuse an existing source), shop selector labels, "N possible rewards", "Only one of these will be offered", "nothing available on this day", and its page-state messages.
- [x] 7.3 Add all new/changed UI copy keys used by both pages and their subviews — no untranslated user-facing strings.
- [x] 7.4 Port every new `shops.json` key and every new `library.json` key to `de`, `es`, and `fr`.
- [x] 7.5 Add `shops-translations.test.ts` (key parity across locales) mirroring `dailies-translations.test.ts`; extend the existing `library` translations parity test for the new keys.
- [x] 7.6 Add id-based icon mapping shared by both pages: the four shop currencies, and reward types (unit shard icon via `unitId`, upgrade-material icon via upgrade id, forge-badge icon via rarity, component icon via alliance) — the V2 equivalent of V1's `rewardInfo` / `summarizeSlotItems`, built on the shared `EntityIcon` / game-catalog icon helpers. Verify icons render on cards in the component tests.

## 8. Joyride tutorials

- [x] 8.1 Add `apps/web/src/fsd/pages/dailies/ui/shops-page.tutorial.tsx` — `useShopsTutorial(): TourPageSteps` (`{ desktop, mobile }`) registered via `useTourPageSteps`, covering the page purpose, the Guaranteed/Possible distinction, and reading a card's cost/needed-by detail. Steps target `data-testid` selectors.
- [x] 8.2 Add `apps/web/src/fsd/pages/library/ui/shops/shops-browse-page.tutorial.tsx` — `useShopsBrowseTutorial(): TourPageSteps` covering the day selector, the shop selector, and how a randomized slot is read.
- [x] 8.3 Add the `tour.shops.steps.*` keys (in `shops.json`) and `tour.libraryShops.steps.*` keys (in `library.json`) across all four locales, alongside 8.1 / 8.2.
- [x] 8.4 Add `shops-page.tutorial.test.tsx` and `shops-browse-page.tutorial.test.tsx` asserting localized desktop and mobile step parity and exact `data-testid` targets, mirroring `today.tutorial`'s test.

## 9. Verification

- [x] 9.1 Manual verification of the **Dailies recommendations page** against the full local stack (workspace Aspire AppHost; `web` + `api` healthy), signed in, against real synced `shops` data — data states: (a) a project with an Active goal whose shard/material need a shop offers today (cards shown, correct counts/costs/needed-by, guaranteed vs. possible), (b) a project whose Active goals need nothing any shop offers today ("nothing to buy today"), (c) no project available (create/select prompt). Check a <768px and a ≥768px viewport.
- [x] 9.2 Manual verification of the **Library browsing page**: open `/library/shops` **while signed out**; confirm it renders, the day selector defaults to today (UTC), switching day and shop updates the slots, multi-reward slots show as "N possible rewards" with the full list, and a day with no slots shows the empty state. Check a <768px and a ≥768px viewport.
- [ ] 9.3 Run both onboarding tours manually, each at one viewport below 768px and one at or above 768px; confirm every step's target resolves and content is localized.
- [x] 9.4 No regression: the Dailies tab bar still shows all 6 primary tabs; Onslaught/Salvage Run/Arena/Guild Raids still show the Under Construction placeholder; the four existing Library collections and their entity routes still work; existing Dailies/Raids/Library tests still pass.
- [x] 9.5 Repo-wide gates in `tacticus-planner-apps`: `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, and `git diff --check` all pass.
