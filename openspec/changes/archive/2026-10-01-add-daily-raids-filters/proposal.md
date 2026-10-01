## Why

V1's Daily Raids has a "Raids Filters" dialog that lets a player restrict which campaign locations the raid planner may suggest (for example "only Necron enemies", "only 5-slot Elite nodes", "at most 6 enemies"). V2's Today and Bonus Raids always pick farm nodes from every eligible battle with no way to constrain them, so players who rely on V1 filters (fewer enemies for quick auto-battle, specific ally/enemy factions to match their roster) cannot reproduce their V1 raids for the day.

## What Changes

- Add a **Raids Filters** action to Dailies > Raids (Today) and to the Dailies > HSE tab, next to the project selector and Planning Settings action (Today) or in the HSE tab header, with an active-filter count badge. The filter is one shared persisted value.
- Add a Raids Filters dialog (bottom sheet on mobile, dialog on desktop via the existing `responsive-dialog`) with V1's sections and fields: Allies (alliances, factions), Enemies (alliances, factions, **enemy traits**, min enemy count, max enemy count, enemy types), Locations (campaign types, slots), Upgrades (rarity; V1's no-op Shard and Mythic Shard options are dropped), and Close / Reset / Apply. Edits are a draft until Apply; Close discards; Reset clears and closes.
- Port V1's pure `passLocationFilter` semantics into a tested pure function and apply it **only to the Today and Bonus Raids engine runs, and to the HSE tab (its farm list candidates and its top-10 locations lists)**. The Raids Plan / Schedule, the Goals page estimates, goal-creation previews and Insights stay unfiltered.
- Unify node selection for upgrades and character shards: the engine first picks the least-energy node(s) as it does today, then removes those that fail the filter (V1's upgrade behavior). A material whose picked nodes are all removed is reported as "filtered out" on Today instead of silently moving to a pricier node. The filter wins over a goal's pinned farm locations: a goal pinned to a node that fails the filter is shown as filtered out, with a notice that names the pin as the cause. (The HSE tab is the one exception: it is a filter-then-pick surface, see design Decision 10 and `add-home-screen-event-tracking`.)
- Add an **Enemy traits** group to the Enemies section: a multi-select of the enemy traits that actually occur on enemies of campaign battles (derived from the served `npcs` dataset through each battle's `detailedEnemyTypes[].id`, the same lookup the HSE raid-point rules use). A battle matches when ANY of its enemies has ANY selected trait (same any-overlap semantics as the other enemy groups). It is stored in `raids-filters.v1` with a backward-compatible default (stored filters written before this group existed still parse), counts as one active group in the badge, is cleared by Reset, and has en/de/es/fr labels.
- Persist the filter per browser (client-side, `localStorage`). Filters are not imported from V1 saves.
- Read per-battle **allies** (`alliesAlliance`, `alliesFactions`) from the catalog `campaign-battles` dataset instead of a hardcoded table. This needs a companion API change.
- Map the filter's campaign-type options to V2 `battle.type` plus campaign release type (concrete table in design and spec).
- Add i18n keys (en, de, es, fr) and id-keyed labels (factions, alliances, rarities, campaign types, enemy traits via the existing `traits` game-data namespace), and use id-based icons (faction/alliance/rarity/trait).
- No **BREAKING** changes in apps. **Companion API change** `add-daily-raids-filters` in `tacticus-planner-api` (**applied first**) adds `alliesAlliance` / `alliesFactions` to the served campaign battle view; this change's catalog schema update depends on it.

## Capabilities

### New Capabilities

- `daily-raids-filters`: the filter model and its matching semantics, the dialog, entry points (Today, HSE tab) and active-count badge, persistence, campaign-type mapping, and how filters constrain Today and Bonus Raids farm-node selection, the HSE tab's farm-list candidates and its top-10 lists (and nothing else).

### Modified Capabilities

None. Today and Plan requirements are unchanged when no filter is set; the new capability adds the filtered behavior for Today, Bonus and the HSE tab only.

## Impact

- `apps/web/src/fsd/features/daily-raids`: new `raids-filters` model and UI (filter types, `passLocationFilter`, campaign-type mapping, persisted hook, dialog); `daily-raids-calc.ts` runs Today and Bonus with a node filter and Plan without (the HSE tab consumes the same predicate as one of its candidate rules); it exports the shared filter plumbing (`useRaidsFilters`, `passLocationFilter`, `buildFarmNodeFilter`) that the HSE tab reuses; `use-daily-raids.ts` supplies the filter (the Home raids widget also reads `useDailyRaids().today`, so it follows the filter); `index.ts` exports.
- `apps/web/src/fsd/features/goal-farming/lib`: `estimate.ts` (`selectFarmNodes`/`classifyNeed`), `estimate-plan.ts` (new optional `nodeFilter` on `EstimatePlanParams`), `estimate-blocked.ts` and `estimate.domain.ts` get an optional node predicate and a new `FilteredOut` blocker reason (no pin bypass in `selectFarmNodes`). Call sites outside the Today/Bonus run (Goals, Insights, previews, `shard-energy-estimate.ts`) do not pass it.
- `packages/game-catalog`: `campaignBattleViewSchema` gains `alliesAlliance`, `alliesFactions`; fixtures updated.
- `apps/web/src/fsd/pages/dailies/ui/today-page.tsx`: trigger, dialog mount and a filtered-out notice (which explains the pinned-goal case); `hse-page.tsx` (from `add-home-screen-event-tracking`) mounts the same trigger and notice; tutorial step if warranted.
- `apps/web/public/locales/{en,de,es,fr}/dailies.json` (filter strings incl. the Enemy traits group; trait labels come from the existing `traits` game-data namespace) and `features/daily-raids/model/raids-filters` (`RaidsFilters.enemiesTraits`, trait option derivation reusing the HSE rules' npc lookup) and icon assets (alliance icons may need copying from V1 `src/assets/images`).
- Coordination: `add-home-screen-event-tracking` (new HSE Dailies tab; its schedule-wide farm list consumes this change's predicate as a filter-then-pick candidate rule) **depends on this change and is applied after it**; this change defines the shared filter plumbing, the HSE change consumes it. `hide-premature-dailies-pages` (Dailies tab set) does not conflict; see design "Coordination".
- Tests: pure filter semantics, type mapping over real catalog values, engine integration (Today/Bonus filtered, Plan unchanged, pinned goals filtered out), dialog, persistence, both layouts. Enemy-traits tests (derivation, parsing/migration, matching, dialog). HSE-tab filter tests live in the HSE change.
- Depends on the companion API change being released first.
