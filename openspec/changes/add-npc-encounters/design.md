## Context

See proposal.md for motivation and the two delta specs for behavior. The served contract
(`npc-encounters`: one record per `(npcId, source, groupId)` with typed `battles`) is defined by the
companion API change `add-npc-encounters` in `tacticus-planner-api`, which applies first.

Current state of the code involved:

- `entities/npc` owns the NPC Library's pure logic: `buildNpcGroups`, `npc-filters.ts`
  (`NpcFilters`, `matchesNpcFilters`, `filterNpcGroups`), `variation-mode.ts` (the suffix labels) and
  `npcLibraryHref`.
- `pages/library/ui/npcs` is an orchestrator (`npcs-page.tsx` + `npcs-page.view-model.ts`) that computes
  flat props for `desktop/` and `mobile/` sub-pages. Shared detail pieces (`npc-detail.tsx`,
  `npc-traits.tsx`, ...) render on both. `npcs.tutorial.tsx` holds the tour.
- Data comes from `useCatalogDataset(key)` (`shared/local-data`), which returns a `ReadState`
  (loading / absent / failed / present).
- Name helpers already exist: `useCampaignDisplay` (`shared/lib`), `useUnitName` (`shared/unit-name`),
  `useRaidBossLabels` (`entities/raid-boss`).
- `events-calendar` rows carry `definitionId`, `confirmed`, `startUtc`, `endUtc` and `parameters`
  (`featuredCharacterId` for `legendary-event` / `quest`; an `incursion` entry opens every MoW, and its `featuredMowId` only marks a debut).

## Goals / Non-Goals

**Goals:**

- One canonical per-variation encounter list. The filter, the section and the tour all read it.
- No new page-to-page or entity-to-feature imports.

**Non-Goals:**

- Enemy levels per encounter, Onslaught probabilities, Sync PvP (the API doesn't serve them).
- A MoW encounter view. MoW NPCs are in the data, but the Library still lists only units.
- Changing the suffix-based Variation labels into encounter-based ones. Labels still describe the id,
  only three label texts are corrected.

## Decisions

### D1. `entities/npc` owns the encounter logic as pure functions

New files in `entities/npc/lib/`, exported through the slice's `index.ts`:

- `encounters.ts`:
  - `NPC_ENCOUNTER_SOURCES` (the fixed source order)
  - `indexEncounters(records) -> ReadonlyMap<npcId, NpcEncounter[]>` (keeps served order)
  - `encounterSources(index, variationId) -> Set<source>`
- `encounter-timing.ts`: `encounterTiming(source, groupId, calendarRows, nowMs)`, returning
  `{ kind: "always" } | { kind: "rotating" } | { kind: "running" } | { kind: "next"; startUtc } | { kind: "none" } | null`
  (`null` = calendar not present). These are the spec's matching rules, unit-tested against fixture rows.
- `number-ranges.ts`: `collapseRanges([3,7,12,13,14]) -> [[3,3],[7,7],[12,14]]`. Formatting the text
  stays in the page.

`npc-filters.ts` gains `gameMode: NpcEncounterSource | null` on `NpcFilters`. `matchesNpcFilters`,
`matchingVariations`, `filterNpcGroups` and `activeNpcFilterCount` take an optional
`encounterSources: (variationId) => ReadonlySet<source>`. With no lookup, a set `gameMode` matches
nothing, so the page clears `gameMode` and hides the control unless the data is present (spec).

_Why entity, not page:_ the filter predicate already lives here, and the "where encountered" lookup is
NPC domain logic another Library page (a future MoW view) would reuse. _Alternative:_ a
`features/npc-encounters` slice. That is more ceremony for logic with one consumer and no user action.

### D2. Timing from `events-calendar`, uniformly

All three time-limited sources resolve through `events-calendar` with the spec's
`definitionId` + parameter match, not through `lres.eventStageStartDatesUtc` (LE), `useQuestInstance`
or `useIncursionWindow`.

_Why:_ one rule and one dataset. Those helpers live in other slices (`features/quest-event`, a page),
and each answers "the current instance" rather than "when does _this_ group run next". The calendar is
the curated source Home already shows. _Trade-off:_ a Legendary Event run listed in `lre-curation.json`
but not yet in `event-occurrences.json` shows "No scheduled run". Calendar curation is the fix for
that, not code.

The page passes the current time into `encounterTiming` from `useMinuteNow` (exported by
`entities/legendary-event`; a page importing an entity is allowed), so an open page moves from
"Next run" to "Running now" at the start time. The entity function itself stays clock-free.

### D3. One section component for desktop and mobile

`pages/library/ui/npcs/npc-encounters.tsx` renders in `npc-detail.tsx`, below traits, on both forms.
On mobile the rows stack (CSS only). There is no layout or interaction split, so there is no separate
mobile component. The tour target is `data-testid="npc-encounters"` on both forms. The section always
renders (including its loading, unavailable and empty states), so the tour target always exists.

### D4. Data loading on the NPC page only

A page hook `hooks/use-npc-encounters.ts` reads `useCatalogDataset("npc-encounters", indexEncounters)`
and `useCatalogDataset("events-calendar")`, memoizes the index, and hands the view model:

- the selected variation's records
- the `encounterSources` lookup
- the calendar rows
- each dataset's `ReadState`

The game-mode options come from the index over the listed (available) variations.

### D5. Names and links

| Source                   | Name helper                                                          | Link                                             |
| ------------------------ | -------------------------------------------------------------------- | ------------------------------------------------ |
| campaign / campaignEvent | `useCampaignDisplay`                                                 | `/my-game/campaigns`, `/my-game/campaign-events` |
| legendaryEvent           | `useUnitName`                                                        | `/legendary-events/{groupId}`                    |
| questEvent               | `useUnitName`                                                        | none                                             |
| incursion                | `useUnitName` (MoW id)                                               | `/my-game/incursions/{groupId}`                  |
| guildRaid                | `useRaidBossLabels().bossName`                                       | `/library/raid-bosses/{groupId}`                 |
| survival                 | `library:npcs.encounters.survivalSeason.{groupId}`, default = raw id | none                                             |
| onslaught                | the source label                                                     | `/my-game/onslaught`                             |

Survival season labels are i18n keys seeded for the three current keys (`survival_may_2026`,
`survival_september_2026`, `survival_crescendo_01`). A new season falls back to its raw id until a
key is added. That's a copy change, not a code change.

### D5a. Who else is at a battle comes from inverting the records

A row opens to its places, and a place opens to its NPCs (the V1 raid-location pattern). `npc-encounters`
is one record per NPC, so `entities/npc` inverts it: `indexEncounterPlaces` maps
`(source, groupId, place key)` to NPC ids, and the page hook memoizes that with the index. No API change.

- The place key is the `battleId`, except: incursion `tier|battleId` (an id repeats per tier), Quest Event
  the battle number (no id is served), Survival the round, Onslaught the tier, Guild Raid one `group` place.
- The list carries what the dataset carries: which NPCs and how many (the battle's `count`), not at what
  rank or in which wave.
  Units the dataset leaves out stay out: `object` NPCs and hero-based guild raid units.
- Onslaught opens per tier, not per round: a tier draws its waves from a weighted pool, so a round is not
  a fixed line-up. Those lists read as "can appear" like the row itself, and their count as "up to N".

### D5b. Location and Running now filter one encounter

Game mode, Location and Running now are matched together against one encounter, so "Campaign" plus "Running
now" cannot match a campaign record and an unrelated running event. The filters therefore take a
`NpcEncounterLookup` (`encountersOf`, `isRunning`) instead of the `encounterSources` set, which is removed.
`isRunning` is `encounterTiming(...)` reading "running", so the filter and the row's status cannot disagree.
Group names move to `useEncounterGroupName`, shared by the rows and the Location options.

### D5c. The mission count is each NPC's own count

The filter answers "where can I kill N of this NPC?", so it compares the encounter's own `count` and never
adds NPCs together, with or without a unit filter. A trait filter narrows which NPCs are listed; it does not
change what the number means. A "defeat N with this trait" mission that a mix of units could finish in one
battle is therefore not found. Totals across NPCs were tried and dropped: a selected NPC showing ×9 under a
minimum of 13 read as a bug. `matchingEncounterPlaces` also narrows the Encountered in section, because finding
the NPC without the battle only answers half the question.

### D5d. One nesting for tiers and tracks

Incursion tiers and event tracks are both `PlaceGroup`s, so a row renders one way. Tier names read the
`incursions` dataset the app already syncs, through `tierLabels`, which moves with the rarity classes from
`pages/my-game` to `entities/incursion` so both pages share them. Other rows stay flat: they have no sub-heading.

### D6. Variation label fixes are a rename

In `variation-mode.ts`, the mode `championEvent` becomes `campaignEvent` and `lhe` becomes `questEvent`.
The `legendary` text becomes "Legendary Event". The i18n keys under `library:npcs.variationMode` are
renamed in all four locales (no stale keys left), and the tests follow.

### D7. Catalog package wiring

In `packages/game-catalog`:

- `schemas/npc-encounters.ts` (zod `looseObject`, matching the API's served shape)
- `"npc-encounters"` in `servedDatasetKeys` and in `optionalDatasetKeys`
- a mapper `byNpcEncounterKey` producing id `"{npcId}|{source}|{groupId}"`
- a Dexie version bump with a full `stores()` block that adds `npc-encounters`
- the `NpcEncounterStorageModel` type

`shared/api/schema.d.ts` is regenerated from the API's OpenAPI artifact.

### New i18n keys (`library` namespace, all four locales)

- `npcs.gameMode`, `npcs.anyGameMode`
- `npcs.encounters.{title, unavailable, none, noneHint, alongside, boss, prime, challenge, canAppear, battles, rounds, tiers, battle, round, tier, tierRangeBattles, count, upTo, matches, tracks.{Standard,Extremis,alpha,beta,gamma}}`
- `npcs.encounters.source.{campaign, campaignEvent, legendaryEvent, questEvent, incursion, guildRaid, survival, onslaught}`
- `npcs.encounters.timing.{always, rotating, running, next, none}`
- `npcs.encounters.survivalSeason.*`
- `npcs.tour.steps.encounters.{title, content}`

The renamed `npcs.variationMode.{campaignEvent, questEvent}` keys are covered by D6.

## Risks / Trade-offs

- [The calendar lags curation, so an LE shows "No scheduled run" while a run is announced] → Accepted
  (D2). The status never claims availability it can't see, which is what #158 asks for.
- [Long lists (a common NPC in many campaign battles)] → Ranges collapse numbers. Each source block
  stays one row per group, so the length is bounded by the number of groups, not battles.
- [The API isn't deployed yet when the apps PR merges] → `npc-encounters` is optional. The section shows
  "encounter data unavailable" and the game-mode filter hides.
- [`useUnitName` may not resolve MoW ids] → Task 4.2 verifies it. If not, use the MoW label helper the
  Incursions page uses (an entity import, not a page import).

## Migration Plan

Merge after the API change is deployed (it can merge earlier, since the dataset is optional). The Dexie
version bump is additive. Rollback is reverting the PR; a downgraded client keeps a harmless extra store.
