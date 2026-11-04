## 1. Catalog data layer (`packages/game-catalog`)

- [x] 1.1 Add `schemas/npc-encounters.ts` (the served shape from the `npc-encounters-catalog` spec) and export it. Verify with `schemas.test.ts` cases: a valid record parses, an unknown `source` fails, and an extra field is tolerated.
- [x] 1.2 Register `"npc-encounters"` in `servedDatasetKeys` and `optionalDatasetKeys`, add the `byNpcEncounterKey` mapper (`"{npcId}|{source}|{groupId}"`), the `NpcEncounterStorageModel` type and a Dexie version bump with a complete `stores()` block. Verify with mapper and sync tests: two records of one NPC store as two rows, a manifest without the dataset still reaches ready, and the upgrade keeps existing stores.
- [x] 1.3 Once the API half has merged, regenerate `apps/web/src/fsd/shared/api/schema.d.ts` with `pnpm --filter web api:types`. Verify the diff only adds the `npc-encounters` path and schema. (Pinned to API `bcd835c`: `schema.d.ts` gains 167 lines and loses none.)

## 2. Entity logic (`entities/npc`)

- [x] 2.1 Add `lib/encounters.ts` (`NPC_ENCOUNTER_SOURCES`, `indexEncounters`, `encounterSources`) with tests: served order is kept per NPC, a missing NPC gives an empty list, and sources come in the fixed order.
- [x] 2.2 Add `lib/encounter-timing.ts` with tests over fixture calendar rows: running now; next run picks the earliest future start; no match gives none; a `confirmed: false` placeholder without parameters never matches; campaign / onslaught give always; campaignEvent / guildRaid / survival give rotating; a missing calendar gives `null`.
- [x] 2.3 Add `lib/number-ranges.ts` (`collapseRanges`) with tests for `[3,7,12,13,14]`, an empty list and a single number.
- [x] 2.4 Extend `npc-filters.ts` with `gameMode` and the optional `encounterSources` lookup (in matching, `matchingVariations`, `filterNpcGroups` and `activeNpcFilterCount`). Verify with `npc-filters.test.ts` cases for the Makhotep game-mode scenario, the count, and "no lookup means no match".
- [x] 2.5 Rename the variation modes (`championEvent` to `campaignEvent`, `lhe` to `questEvent`) in `variation-mode.ts` and its tests. Verify `variation-mode.test.ts` maps `admecBossMarshallCE` to `campaignEvent` and `necroBossWardenLHE` to `questEvent`.
- [x] 2.6 Export the new functions and types from `entities/npc/index.ts`, and verify `pnpm lint:fsd` passes.

## 3. Page: data and filter

- [x] 3.1 Add `pages/library/ui/npcs/hooks/use-npc-encounters.ts` (encounters + calendar `ReadState`s, memoized index), and feed the view model: the selected variation's records, game-mode options from the listed available variations, and the lookup. Verify with view-model tests: options only list sources present, and the order is fixed.
- [x] 3.2 Add the single-select game-mode control to `npcs-filter-bar.tsx` / `npcs-filter-panel.tsx`, shown only while `npc-encounters` is present, and clear `gameMode` when the data is not present. Verify with `npcs-page.test.tsx` cases for the game-mode scenarios of the `npc-library` delta, including "hidden without encounter data".

## 4. Page: encounters section

- [x] 4.1 Add `npc-encounters.tsx` rendered in `npc-detail.tsx` below traits (`data-testid="npc-encounters"`), with:
  - source blocks in fixed order and one row per record
  - location text per source with collapsed ranges, challenge marks and track labels
  - timing status from `encounterTiming` with `useMinuteNow`
  - the links table from design D5
  - the loading, unavailable and no-recorded-encounters states

  Verify with `npcs-page.test.tsx` cases covering every scenario of the ADDED requirement and the encounter states in the modified states requirement.

- [x] 4.2 Resolve group names with `useCampaignDisplay`, `useUnitName`, `useRaidBossLabels().bossName` and the survival season keys. Verify with tests that an incursion row shows the MoW's localized name; if `useUnitName` does not cover MoW ids, switch to the MoW label helper per the design risk and record it in design.md.
- [x] 4.3 Verify on a test with a 390px viewport mock that rows stack and the section causes no horizontal overflow.

- [x] 4.4 Make rows expandable: add `encounterPlaces`, `indexEncounterPlaces` and `npcsAtPlace` to `entities/npc/lib/encounters.ts` (design D5a), feed the place index through the page hook and view model, and open a row to its places and a place to its NPCs. Verify with `encounters.test.ts` cases for each source's places and for keeping incursion tiers apart, and `npcs-page.test.tsx` cases for the two new scenarios.

- [x] 4.5 Show how many of each NPC a place spawns from the battle's `count`, "up to N" for Onslaught and nothing for a Guild Raid. Verify with `encounters.test.ts` and `npcs-page.test.tsx` cases for all three.

- [x] 4.6 Add the Location and Running now filters (design D5b). Verify with `npc-filters.test.ts` cases for each filter and for one encounter having to satisfy them all, and `npcs-page.test.tsx` cases for the new scenarios of the filters requirement.

- [x] 4.7 Add the "Min. in one battle" mission filter and narrow the encounters section to the battles meeting it (design D5c). Verify with `npc-filters.test.ts` cases for one NPC, a unit filter not adding NPCs together and Guild Raid, and an `npcs-page.test.tsx` case for the list and section together.

- [x] 4.8 Show one chip per NPC and level, each opening that variation at that level, from the battle's `levels`. Verify with an `npcs-page.test.tsx` case and by checking the opened level against the Legendary Event and campaign pages.

- [x] 4.9 Nest an Incursion's battles under its tiers. Verify with an `npcs-page.test.tsx` case for the tier summary, opening a tier and a battle, and the challenge label.

- [x] 4.10 Name and colour Incursion tiers by rarity in the row summary and the tier rows, and nest Campaign Event and Legendary Event battles under their tracks (design D5d). Verify with `npcs-page.test.tsx` cases for the rarity names and class, both track cases, and the Incursions page tests staying green after `tierLabels` moves.
- [x] 4.11 Stop a chosen Location narrowing the list once refreshed encounter data no longer offers it. Verify with `npcs-page.test.tsx`.
- [x] 4.12 From review: a chip clears filters that exclude its variation; a mission count keeps the other encounter filters; the next run reads the viewer's date; Incursion timing uses `incursionWindow`, so `encounter-timing` moves to `pages/library/model`; the tier name and campaign label reuse their shared helpers; the page stops reading the clock while "Running now" is off. Verify with the `npcs-page.test.tsx`, `encounter-timing.test.ts` and `format-estimate-date.test.ts` cases.
- [x] 4.13 Skip a record or battle with a source or role this build does not know, so a newer API cannot cost clients the whole optional dataset. Verify with `schemas.test.ts`.

## 5. Copy and tour

- [x] 5.1 Add the `library` keys listed in design.md and rename `npcs.variationMode.{championEvent,lhe}` to `{campaignEvent,questEvent}` (with "Legendary Event" for `legendary`) in `en`, `de`, `es` and `fr`, with real translations at the quality of the sibling keys. Verify no English text is left in de/es/fr and the i18n type check passes.
- [x] 5.2 Add the encounters step to `npcs.tutorial.tsx` for desktop and mobile, with `npcs.tour.steps.encounters.{title,content}` in all four locales. Verify `npcs.tutorial.test.tsx` checks the step targets on both forms.

## 6. Desktop verification (viewport >= 768px)

Required data states: a local stack (Aspire) with the API half running. An NPC with records in several
sources (e.g. Hormagaunt), an NPC with a Legendary Event record whose event has a calendar occurrence,
and an NPC with no records (e.g. an `LHE` variation of a past quest).

- [x] 6.1 On `/library/npcs` at 1280px, verify the encounters section for the multi-source NPC (order, ranges, timing, links), the no-records state, the game-mode filter narrowing list and variations, and the tour's encounters step. Capture screenshots in the PR. (Re-checked 2026-11-04 on the final build: Location, Running now, Min. in one battle, level chips, tier and track nesting.)

## 7. Mobile verification (viewport < 768px)

- [x] 7.1 In a 420px same-origin iframe of `/library/npcs` (per the `tp-manual-ui-verification` skill), confirm the mobile combobox layout renders, then verify the stacked encounter rows, the game-mode control in the mobile filters, and the tour's mobile encounters step. Capture screenshots in the PR. (Re-checked 2026-11-04 at 420px on the final build: all filters, dropdown placement, nested rows, level chips and a chip click.)

## 8. Gates

- [x] 8.1 Run `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd` and `git diff --check`, and verify all pass. (Run 2026-11-03 on this machine: typecheck, lint, lint:fsd and diff --check pass; test:run passes except 20 tests in 14 files outside this change, mostly date/time-zone formatting under the cs-CZ locale plus `analytics-provider` "re-identifies…". All 20 fail identically with this change stashed. The one failure the change caused, `library-translations.test.ts` (new `encounters` tour step), is fixed.)
