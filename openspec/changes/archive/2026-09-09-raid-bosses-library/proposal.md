## Why

`/library/raid-bosses` is scaffolded (route, nav entry, i18n keys) but renders a placeholder — _"Raid Bosses are not available in the catalog yet."_ V1's `learn/guildBosses` cluster (a boss/prime portrait grid that links to a rich per-boss detail view) has no V2 equivalent. This change consumes the new `raid-bosses` served game-catalog dataset and builds the real Library list + detail experience, following the `tp-reimplement-v1-page` pattern (redesign the UX, preserve the behavior, resolve every name/icon from an id).

This is the frontend half of a cross-repo pair. The companion is the `raid-bosses-library` change in `tacticus-planner-api`, which adds the `raid-bosses` served dataset and applies first. Tracked by [TacticusPlanner/tacticus-planner-apps#86](https://github.com/TacticusPlanner/tacticus-planner-apps/issues/86).

Scope is **list + detail** parity with V1, including raid-boss **primes** as a first-class section and detail target. V1's separate guild-raid-season / tier-ladder view (`learn/guildBossReference`) is out of scope.

## What Changes

- **Client game-catalog package** (`packages/game-catalog`): treat `raid-bosses` as a synced served dataset — manifest-diff sync, schema validation on download, its own IndexedDB store(s) via the version-cascade upgrade mechanism. Add `getRaidBosses()` (and a bosses/primes-split accessor) to `@workspace/game-catalog/queries`, plus id→icon helpers in `packages/game-catalog/src/game-entities` for raid-boss unit-set / field-npc / raid-boss-ability / raid-boss-trait ids.
- **Library list page** (`/library/raid-bosses`): replace `LibraryNoRecordsPage` with a real page rendering two sections — **Bosses** and **Primes** — as a portrait grid/list. Selecting an entry navigates to `/library/raid-bosses/{unitSetId}`, honoring the existing `library-entity-routes` contract (first-entity canonicalization, secondary-query preservation, back/forward).
- **Raid-boss detail** (`/library/raid-bosses/{unitSetId}`): a per-boss/prime view with a progression-step selector driving a stat block (health, damage, armor, rank/stars, crit/block when present), weapons (attack-profile rows), active/passive/relic abilities and traits (resolved from ids), and per-encounter **field enemies** and **encounter modifiers** (the `{ hpLost, type, target, amount }` definitions the API inlines). Modifier _application_ math (scaling stats/abilities by active modifiers) is ported from V1 as pure client logic in a feature slice.
- **Desktop vs mobile**: desktop — sidebar/section grid + a dense detail with side-by-side stat/ability panels; mobile — sectioned list, detail as stacked cards + accordions, a progression stepper instead of a wide selector. Implemented with the orchestrator + `desktop/` + `mobile/` sub-page pattern.
- **i18n**: new id-keyed namespaces `raidBosses` (unit-set ids → boss/prime names), `raidBossAbilities`, `raidBossTraits`; generate `en` from catalog/V1 reference data, add `de`/`es`/`fr` translations at sibling quality; register the TS resource types; lazy-load per page. New UI copy (section headers, stat labels, empty/error states) goes in the existing `library` namespace.
- **Onboarding tour**: a co-located `raid-bosses.tutorial.tsx` (`useRaidBossesTutorial`) with desktop + mobile steps targeting `data-testid`s, registered via `useTourPageSteps`, with `tour.raidBosses.steps.*` i18n keys in every locale.
- **Assets**: copy the raid-boss / prime / field-npc portraits V2 is missing from `tacticusplanner/src/assets/images/snowprint_assets/**` into `apps/web/public/game_catalog/**`; use `<EntityIcon>` with a text-badge fallback for anything still missing; document genuine gaps.
- **V1-parity checklist** (in `design.md`): every V1 asset/icon id reused, the V1 nav/layout pattern and whether it's kept, and a keep / drop / redesign decision for each V1 secondary state (progression selector, prime modifier dual-panel, battlefield-enemies popovers, "boss not found", ability-text variable interpolation).

## Capabilities

### New Capabilities

- `raid-boss-catalog`: the client game-catalog package's raid-boss data layer — sync, store, the `getRaidBosses()` query surface, and id→label/icon resolution for raid-boss unit-set / ability / trait / field-npc ids.
- `raid-boss-library`: the `/library/raid-bosses` list (Bosses + Primes sections) and per-entity detail (progression-stepped stats, weapons, abilities, traits, field enemies, encounter modifiers), including its desktop/mobile split and loading / load-failure / dataset-absent / no-selection states.

### Modified Capabilities

- none — `library-entity-routes` already names `/library/raid-bosses` and its `/{entityId}` segment and already specifies first-entity canonicalization and the no-records state; this change only makes the collection non-empty, which the existing contract already covers.

## Impact

- **Package**: `packages/game-catalog` — new dataset key handling, schema, IndexedDB store + version bump, `queries` additions, `game-entities` icon helpers; `@workspace/game-catalog` public API surface grows.
- **App**: `apps/web/src/fsd` — new `entities/raid-boss` (id→label/icon, structural types), new `features/raid-boss-detail` (modifier-application calc, ability-text rendering reuse), rebuilt `pages/library/ui/raid-bosses/**` (orchestrator + desktop/mobile), `pages/library/route.tsx` swaps `LibraryNoRecordsPage` for the real page, `library` i18n namespace additions, 3 new i18n namespaces × 4 locales, `apps/web/src/test/setup.ts` jsdom polyfills if new Radix primitives are used.
- **Tests**: modifier-application calc unit tests (ranges/edge cases), id→icon mapping + fallback tests, page-renders-unauthenticated-with-mocked-catalog tests, landing/nav link test update, tutorial coverage at one <768px and one ≥768px viewport.
- **Depends on**: `tacticus-planner-api` `raid-bosses-library` (served `raid-bosses` dataset) — applied first.
