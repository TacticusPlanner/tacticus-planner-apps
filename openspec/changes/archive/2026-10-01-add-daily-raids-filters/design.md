## Context

V1 (`tacticusplanner`): `src/fsd/3-features/goals/locations-filter.tsx` renders the dialog; `ICampaignsFilters` (`4-entities/campaign/model.ts`) is the filter shape; `CampaignsService.passLocationFilter` (`campaigns.service.ts`) is the matcher; the filter lives in the redux `dailyRaids.filters` slice and is fed to `UpgradesService.getUpgradesEstimatedDays` (`populateLocationsData` sets `isPassFilter`; `isSuggested = preferred && isPassFilter`) and to `shards.service.ts`.

V2 (`tacticus-planner-apps/apps/web`): one engine call (`features/daily-raids/model/use-daily-raids.ts` -> `calculateDailyRaids` in `daily-raids-calc.ts`) builds one `EstimatePlanParams` and derives `today` (`estimateTodaySchedule`), `bonus` (`estimateBonusRaids`) and `plan` (`estimatePlanSchedule`) from it. Eligible nodes come from `useEligibleCampaignBattles`; node choice is `selectFarmNodes` in `goal-farming/lib/estimate.ts` (least `energyPerItem`, or only the goal's pinned `farmingLocationIds`). Character shards are `EstimateUpgrade` entries with `farmLocations`, so shards and upgrades already go through the same `selectFarmNodes` path. The catalog `campaignBattleViewSchema` carries `slots`, `enemiesAlliances`, `enemiesFactions`, `enemiesTotal`, `enemiesTypes` and `type` (`Standard`, `Mirror`, `Elite`, `EliteMirror`, `Extremis`); `campaign-definitions` carries `releaseType` (`standard` | `event`). `useDailyRaids` is consumed by Today, Plan > Schedule and the Home raids widget (which reads `today`).

## Goals / Non-Goals

**Goals:** preserve V1 filter semantics for node matching; expose the filter on Today and the HSE tab; redesign the UI for mobile and desktop; keep every other surface unchanged.

**Non-Goals:** filtering Plan/Schedule, Goals estimates, goal-creation previews or Insights (decided: Today, Bonus and the HSE tab only); server persistence; per-project filters; V1 filter import; changing farm-node preference logic when no filter is set.

## Decisions

### 1. Where the filter applies in the engine (Today, Bonus and the HSE tab only)

`EstimatePlanParams` gains an optional `nodeFilter?: FarmNodeFilter` where `FarmNodeFilter = (battleId, resourceId) => boolean`. `calculateDailyRaids` builds the predicate (it closes over the catalog battles and, for the upgrade-rarity criterion, `upgradesById`) and calls:

- `estimateTodaySchedule({ ...calculation, nodeFilter })` and `estimateBonusRaids({ ...calculation, nodeFilter })` (Bonus calls Today twice; the filter rides along via the spread);
- the HSE tab does NOT run the day loop. Its schedule-wide farm list (`add-home-screen-event-tracking`) receives the same predicate from `calculateDailyRaids` and uses it as one of its candidate rules in filter-then-pick mode (Decision 10);
- `estimatePlanSchedule(calculation)`, `blockedGoalsOf`, `calculateResourceUrgency` and everything else **without** it.

`nodeFilter` exists only on `EstimatePlanParams`; `estimateGoal` stays callable without it, and Goals, Insights, goal-creation previews and `shard-energy-estimate.ts` never pass it. `nodeFilter` is the one shared plumbing the HSE change reuses; see Decision 10. Consequence to state plainly: with a filter active, Today can differ from day 1 of Plan > Schedule, and Goals dates are unaffected. Empty filter passes `undefined`, so current behavior and tests are untouched.

Home raids widget: it renders `useDailyRaids().today`, so it follows the filter (it shows the same raids as Today). This is intentional; it is the same list the user sees on Today.

Filtered-out surfacing: the Today run's per-goal outcomes already carry blockers (`runPlanSchedule` returns them); `calculateDailyRaids` exposes the ones with reason `FilteredOut` as a Today-only view-model field. Today shows a notice ("N materials have no allowed location with these filters", with a Reset action; for pinned goals: "N goals are pinned to a location excluded by your Raids Filters. Reset the filters or change the pin."). The Plan-side `blockedGoals` come from the unfiltered run and never contain `FilteredOut`.

### 2. Node ordering: pick the cheapest, then filter (one behavior for upgrades and shards)

Decision (Today and Bonus Raids; the HSE tab deliberately differs, see Decision 10): for **every** material (upgrades and character shards) `selectFarmNodes` first selects the least-`energyPerItem` tied set over the eligible nodes exactly as it does without a filter, then drops nodes that fail the filter. A material whose selected nodes are all dropped is blocked with `FilteredOut`; it is not moved to a pricier passing node. If at least one node of the tied set passes, the material stays scheduled on the passing node(s).

Why this and not filter-then-pick-best: V1's `populateLocationsData` comment says pick-then-drop is intentional for upgrades (a Necron-only enemy filter must not drop a cheaper Mirror node and promote a pricier plain-Necron node that was never the efficient choice). That is a real reason to prefer it, and it also matches how V2's one code path already works. The "never silently yields no node" concern is met differently: the empty result is not silent. It becomes the visible `FilteredOut` notice on Today, and Reset clears it in one tap.

User-visible effect: with a restrictive filter, a player can see "filtered out" for a material where a pricier passing node exists (for example, the cheapest Orks shard node is a 3-slot Mirror and the filter says 5 slots; V1 shards would have moved to the next-cheapest 5-slot node, V2 reports the material as filtered out). This is a deliberate change from V1 shard behavior to make shards behave like V1 upgrades. Alternative (filter first, pick the best passing node for everything) would always find a node when one exists but would schedule energy-inefficient farms the player never asked for; it can be adopted later by changing the order in `selectFarmNodes` only.

Implementation: in `selectFarmNodes` the tied min-efficiency set is computed first, then `nodeFilter` is applied; `classifyNeed` maps "picked non-empty, filtered empty" to blocker `FilteredOut` (new `EstimateBlockedReason`, `estimate.domain.ts`/`estimate-blocked.ts`; exhaustive consumers updated).

### 3. The filter wins over pinned goal locations (decided)

How V2 pins: a goal can carry `farmingLocationIds` (Goal edit > farming locations picker, and the Campaign source in Unlock/Ascension acquisition sources). When set, `selectFarmNodes` considers only those battles instead of auto-picking the cheapest. The filter is applied to that pinned set exactly as to an auto-picked set: there is **no pin bypass** in `selectFarmNodes`.

Example. The player pins the "Ascend Tigurius" shards to Indomitus Elite 12 (Necron enemies) and then sets Enemy factions = Orks. Elite 12 fails the filter, so the Tigurius shards are reported as "filtered out" on Today (and the HSE tab) until the player clears the filter or changes the pin. The filter is a hard rule for the whole day.

Because this can look like a bug ("I pinned that node"), the filtered-out notice distinguishes the cause: for a goal that has `farmingLocationIds`, the entry reads that its pinned location is excluded by the Raids Filters (with Reset); for auto-picked materials it reads that no allowed location matches. The blocker carries a flag (`pinned: boolean`) so the notice can group the two cases; the reason stays `FilteredOut`.

### 4. Filter model and matcher

Pure, structural, in `features/daily-raids/model/raids-filters/`:

- `raids-filters.domain.ts`: `RaidsFilters` = `{ alliesAlliances: Alliance[]; alliesFactions: FactionId[]; enemiesAlliances; enemiesFactions; enemiesTraits: string[]; campaignTypes: RaidsCampaignType[]; upgradeRarities: Rarity[]; slots: number[]; enemiesTypes: string[]; enemiesMin?: number; enemiesMax?: number }`, `emptyRaidsFilters`, `countActiveFilterGroups`. `upgradeRarities` has no Shard/Mythic Shard member (V1's options were no-ops; hidden in V2).
- `pass-location-filter.ts`: port of the V1 matcher (order-independent AND; slots default 5; rarity restricts only upgrade materials, character-shard materials are not restricted by it). Allies come from the battle's `alliesAlliance`/`alliesFactions`.
- Storage validation via a zod schema (ids strings; unknown ids tolerated and ignored). Every list has a zod `.default([])`, so a value stored before `enemiesTraits` existed still parses (see Decision 11).
- `RaidsFilterBattle` gains `enemiesTraits: readonly string[]`, the union of the traits of the battle's enemies, precomputed by `buildRaidsFilterBattles` (Decision 11).
  No new naming tier beyond `RaidsFilters` (domain) and a storage schema in the persistence hook, per the naming-conventions skill.

### 5. Allies data: catalog field, not a hardcoded table

V1 derived allies from a hardcoded per-campaign table (`CampaignsService.getEnemiesAndAllies`). V2 gets them from the API: the served `campaign-battles` view gains `alliesAlliance: string` and `alliesFactions: string[]` (copied from the campaign group; see the companion API change). The apps change only updates `campaignBattleViewSchema`, fixtures and the matcher. The hardcoded `campaign-allies.ts` and its completeness test are not built; the API change owns completeness (every battle has allies, validated at catalog load). **API applied first** (the zod schema requires the fields).

### 6. Campaign-type mapping (V1 options to V2 battle data)

V1 filter options: Elite, Extremis, Standard, Mirror, Normal, Early. V1 type of a battle is a per-node `campaignType`; V2 `battle.type` is the game's own vocabulary and the storyline/event distinction lives on the campaign group (`campaign-definitions.releaseType`). Verified against the catalog (`campaign-battles-*.json`: storyline groups `campaign1-4`/`elite1-4`/`mirror1-4`/`eliteMirror1-4` carry types `Standard`, `Elite`, `Mirror`, `EliteMirror`; event groups `eventCampaign1-6` carry `Standard` (incl. challenge battles) and `Extremis`) and against V1 `new-battle-data.json`. The mapping:

| V1 option | V2 rule                                                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Normal    | `type` = `Standard` and group `releaseType` = `standard`, excluding Early                                                                  |
| Early     | group `campaign1` (Indomitus), `type` = `Standard`, `energyCost` = 5 (V1's 15 five-energy nodes)                                           |
| Mirror    | `type` = `Mirror`                                                                                                                          |
| Elite     | `type` = `Elite` or `EliteMirror` (V1 types Mirror Elite nodes as Elite)                                                                   |
| Standard  | `type` = `Standard` and group `releaseType` = `event` (V1 Standard includes Challenge nodes; so does V2 `Standard` with `challenge: true`) |
| Extremis  | `type` = `Extremis` (includes Challenge nodes, as V1)                                                                                      |

Indomitus SuperEarly nodes (V1: 0- and 3-energy, no raid rewards) match no option, so any campaign-type filter excludes them, same as V1. A test over every real catalog battle asserts each maps to exactly one option (or none for SuperEarly). The client derives `releaseType` by joining `campaignGroupId` to the already-loaded campaign definitions.

### 7. Persistence

Client-side via `localStorage` (key `raids-filters.v1`), exposed by a `useRaidsFilters()` hook using a `useSyncExternalStore`-style shared subscription so every consumer (Today, the HSE tab, the Home widget through `useDailyRaids`) and other tabs stay in sync; the stored shape is forward/backward compatible by zod defaults (no key bump: `raids-filters.v1` keeps its name and a stored value without `enemiesTraits` reads as no trait filter); try/catch around every access and validation fallback to empty (same pattern as `shared/lib/use-persisted-selection.ts`, which is string-only so cannot be reused directly). Rationale: avoids a cross-repo user-settings/migration change for a view preference. Trade-off: not synced across devices.

### 8. UI (redesigned, not copied)

- `RaidsFiltersTrigger` (icon button + count badge, mirrors `PlanningSettingsTrigger` in `entities/planning-setting`) mounted in `today-page.tsx` next to the Planning Settings trigger, and in the `hse-page.tsx` header (added by the HSE change), with a `data-testid`. Not mounted on Schedule, Plan or Goals.
- `RaidsFiltersDialog` built on `shared/ui/responsive-dialog` (sheet on mobile, dialog on desktop). Sections use a labeled heading + 2-column grid; multi-selects built from `@workspace/ui` Popover + Command with checkmarks and an icon-chip summary (check for an existing multi-combobox in `shared/ui` first; `unit-combobox`/`rarity-combobox` are references). Min/Max use a searchable single select. Draft state is local to the dialog (initialised from applied filters on open); Close discards, Reset writes the empty filter and closes, Apply writes the draft.
- i18n: `dailies` namespace gets `raidsFilters.*` strings; alliance/faction/rarity labels are id-keyed (`factions:<id>` exists; alliance labels reuse/extend the existing `library.alliances` keys, else add `alliances` keys to `common` or a new `alliances` namespace); campaign type labels are new `raidsFilters.campaignTypes.*` keys; the filtered-out notice has separate `raidsFilters.filteredOut.*` strings for the auto-picked and pinned cases.
- Icons: faction icons from `@workspace/game-catalog` id helpers; rarity via `shared/ui/rarity-icon`; alliance icons may be missing in V2 `public/game_catalog` and need copying from V1 `src/assets/images` (fallback: text badge).

### 8b. Tutorials

Raids Today has a Joyride tour (`today.tutorial.tsx`). Add a step targeting the filters trigger if the project rule requires every interactive addition to be covered; otherwise record the intentional omission.

### 9. Enemy/type option sources

Min/Max options and Enemy Types are derived from loaded battles (`enemiesTotal`, `enemiesTypes`) via `useLiveQuery(getCampaignBattles)`, matching V1's `getPossibleEnemiesCount/Types`. Enemy trait options are derived the same way (Decision 11).

### 10. Shared plumbing for the HSE tab

This change owns and exports, from `features/daily-raids` (`index.ts`): `useRaidsFilters()`, `passLocationFilter(battle, filters, material?)`, `countActiveFilterGroups`, `RaidsFiltersTrigger`/`RaidsFiltersDialog`, the filtered-out notice component, and `buildFarmNodeFilter(filters, battlesById, upgradesById): FarmNodeFilter | undefined` (undefined for an empty filter). `calculateDailyRaids` accepts the optional node score from the HSE change and applies `nodeFilter` to every run that is not the Plan. The HSE top-10 lists call `passLocationFilter(battle, filters)` without a material (the rarity criterion then does not restrict), so they list only passing locations.

**HSE farm list (changed by user feedback, supersedes the earlier "obeys the same rules as Today").** The HSE tab's farm list (`add-home-screen-event-tracking`) is a filter-then-pick surface: the applied filter (the same `FarmNodeFilter` built by `buildFarmNodeFilter`) is combined with the implicit rule "the node earns event points" into one candidate predicate, and the farm list is chosen among the passing nodes. It never reports a material as `FilteredOut`, so the HSE tab does not mount the filtered-out notice; a filter that leaves no candidate shows the HSE tab's own empty state with a Reset action. Today and Bonus keep pick-then-drop (Decision 2) and the notice. The filter remains one shared persisted value, so Today and the HSE tab always show the same badge count. The HSE change adds no filter logic of its own beyond combining predicates.

### 11. Enemy traits group (reopened scope)

New group in the Enemies section, after Factions: `enemiesTraits: string[]` ("Enemy traits"), a multi-select whose empty state reads "All traits".

- **Matching.** A battle passes when at least one of its enemies has at least one selected trait: `anyOf(filters.enemiesTraits, battle.enemiesTraits)`, the same any-overlap rule as Enemy alliances/factions/types. It is ANDed with every other criterion and unaffected by Summon/Steppable (see option list below).
- **Per-battle traits.** `RaidsFilterBattle.enemiesTraits` is the de-duplicated union over the battle's `detailedEnemyTypes[].id` of the resolved `npcs` record's `traits`. The lookup is the one the HSE raid-point rules already use (`getNpcsMap()` and the rules' `RuleNpc`/`RuleBattle` shapes in `home-screen-event-rules.ts`); a small shared helper `battleEnemyTraits(battle, npcsById)` next to the rules owns the "enemy id to traits" resolution, so the filter does not duplicate it. An enemy id the dataset cannot resolve contributes no traits (never guessed), consistent with the rules. `buildRaidsFilterBattles` takes the npc map as an extra argument; while the npc dataset is still loading, the filter treats a battle's traits as empty and the trait group is disabled in the dialog (like the other data-derived fields).
- **Option list.** Derived from data, not hardcoded: the distinct traits that occur on enemies of at least one campaign battle, sorted by localized label. Checked against the served data: 46 traits occur (BattleFatigue, Overwatch, Flying, Mechanical, HeavyWeapon, Daemon, Emplacement, TwoManTeam, TeleportStrike, SuppressiveFire, Psyker, Infiltrate, TerminatorArmour, Swarm, BigTarget, ... down to Healer, Explodes, BeastSlayer). `Summon` and `Steppable` occur on no enemy of any campaign battle (design Q1 of the HSE change), so a derived list never offers them and nothing needs excluding; if a future dataset puts them on a battle enemy they would simply appear as options (they are real traits and the filter is about the player's own preference, unlike the HSE points where the game's tracker excludes them). The separate `Mechanic` trait (57 battles) is a different trait from `Mechanical` (302 battles) and is offered as its own option; the labels differ.
- **Labels.** The existing game-data mechanism: `t("traits:<id>", { defaultValue })` (the `traits` namespace, used by the NPC library and Team Recs), with a humanised id (`PermaDeath` becomes "Perma Death") as the fallback for ids the namespace lacks (PermaDeath, Boss, BeastSlayer today). The `traits` namespace ships in `en` only, so de/es/fr use the English game-term labels through the normal `fallbackLng`, the same as every other trait surface; the _dialog strings_ (group label, placeholder "All traits", etc.) are translated in all four locales. Trait icons from `traitIcon(id)` in `@workspace/game-catalog`.
- **Persistence/migration.** `enemiesTraits` has zod `.default([])`: an existing `raids-filters.v1` value without it parses and reads as "no trait filter"; a value with it round-trips. No key bump.
- **Badge/Reset/sanitize.** Counts as one active group (now eleven possible groups); Reset and `emptyRaidsFilters` clear it; apply drops selected traits the loaded catalog no longer has (same as Enemy types).
- **Scope.** Applies wherever the filter applies: Today, Bonus Raids, the HSE farm list and both HSE top-10 lists.

## Coordination with sibling changes

- `hide-premature-dailies-pages`: removes the Onslaught/Arena/Salvage Run tabs. This change adds no tab, only an action inside the Raids (Today) page (and the HSE tab when it exists), so it does not collide.
- `add-home-screen-event-tracking` (apps + api): adds a Dailies "HSE" tab with a schedule-wide, energy-capped farm list and two top-10 lists. **Order: this change is applied first; the HSE change depends on it** and records that as a prerequisite. This change therefore does not touch `hse-page.tsx`; the HSE change mounts the shared trigger and filter on it. The HSE farm list does not use the day-loop engine, so there is no longer a shared `selectFarmNodes` change between the two (the earlier optional node score was removed). The sibling's API change edits only `Data/events/*`, unrelated to this change's `campaign-battles` change, but both move the manifest snapshot, so apply them in sequence and promote the snapshot after each.

## Risks / Trade-offs

- [A strict filter can blank out Today] -> the filtered-out notice and badge make the cause discoverable; Reset is one tap.
- [Enemy traits need the npc dataset in the filter model] -> `buildRaidsFilterBattles` gains one argument; battles are treated as trait-less until the npc map loads, and the group is disabled meanwhile.
- [Today differs from Plan day 1 while a filter is active] -> intended and documented; Plan is the unconstrained plan.
- [Shard behavior differs from V1 (filter-first)] -> deliberate unification, documented in Decision 2.
- [Engine signature change touches shared code used by Goals estimates] -> optional parameter only on `EstimatePlanParams`, default undefined; existing tests must pass unchanged; `plan-surface-agreement.test.tsx` guards Goals/Today/Schedule agreement.
- [Apps zod schema requires the new battle fields] -> API applied first; looseObject tolerates extra fields only, so an older API would fail validation loudly rather than filter wrongly.

## Migration Plan

Greenfield V2; no data migration. V1 filters are not imported (the `v1-import` spec covers profile data only; decided). Rollback is removing the trigger; the persisted key is harmless.

## Open Questions and Assumptions

Decided with the user: Today, Bonus and the HSE tab only (1); local-only persistence (2); allies from an API catalog field (3); no V1 filter import (4); pick-then-drop for both upgrades and shards (5); Shard/Mythic Shard options hidden (7); campaign-type mapping fixed above (8); the filter wins over pinned goal locations (6); the HSE tab's farm list and top-10 lists honor the filter (9; the farm list as filter-then-pick, Decision 10); Enemy traits group with any-overlap matching, data-derived options, existing `traits` labels, backward-compatible storage (11).

**Reopened:** the original 25/25 task completion is reopened for the Enemy traits group (tasks 7.1 to 7.7 and the HSE-semantics note in 3.3). The previously completed work stands; the new tasks are unchecked.

None open.
