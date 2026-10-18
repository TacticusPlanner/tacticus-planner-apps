# Design

## Context

- The catalog has a `new-character-event` definition (`type: NewCharacterEvent`, parameter `featuredCharacterId`). It has a single authored occurrence: Sekhetar Robot, 2026-08-09, whose id `sekhetar-robot` is not a unit id. There is no Zapspitta occurrence and no mission data. HRE missions are the same in every event; only the alliance-dependent and featured-hero objectives change (confirmed by Severyn).
- The Dailies HSE tab already composes everything the raid suggestions need, inside `features/daily-raids`:
  - eligible battles: `useEligibleCampaignBattles`
  - attempts left and real energy spent today: `daily-raids-energy.ts`
  - persisted Raids Filters: `buildFarmNodeFilter`
  - the goal-scoped schedule need: `allocatePlanInventory`, via `goal-farming/@x/daily-raids`
  - the HSE farm list: `planEventFarm`
- Synced token buckets per mode are already read for the HSE projection (`hse-token-supply.ts`).
- Mission progress is not in synced player data, which is inferred from the absence of any HRE fields in the sync payload. Severyn asked for it to be kept in local storage.

## Goals / Non-Goals

**Goals:**

- One HRE tab that a player keeps open during the 14 days: what mission am I on, what does it need, and where do I raid.
- A new HRE needs only a calendar occurrence (featured hero and window), with no mission edits.

**Non-Goals:**

- An instance switcher for past HREs.
- Legendary-character events, which have a different structure. They are left out, as Severyn decided.
- Syncing progress across devices.

## Decisions

### D1. The mission list is a constant in the app, worded by alliance

`features/hre-missions/model/hre-missions.ts` holds the 21 missions as data. A mission is `{ number: 1..21, objectives: [Objective, Objective] }`. An objective is `{ kind, target, qualifier? }`:

- `kind` is one of `campaignWins`, `campaignRaids`, `arenaBattles`, `guildRaids`, `onslaught`, `salvageRuns`, `lightningVictories`, `killEnemies`, `killWithMelee`, `killWithRanged`, `killWithAlliance`, `killFaction`, `damage`, `abilityDamage`, `damageType`, `featuredDamage`, `useAbilities`, `useAbilitiesAlliance`, `useAbilitiesFeatured`, `heal`, `winWithoutSummons` or `winWithAllianceLineup`.
- `qualifier` is `{ faction }` or `{ damageType }`. Kinds ending in `Alliance` or `Lineup` take the featured hero's alliance, and `*Featured` kinds take the hero's name, both at render time.

The wording comes from i18n templates per kind, with `{{target}}`, `{{alliance}}` and `{{hero}}`. The targets follow Zapspitta's mission sheet, which matches the wiki's current list.

- _Alternative:_ serve the missions from the API catalog per occurrence. That was rejected because the lists do not differ between events, so it would add a dataset, a merge and a schema for nothing.

### D2. Slices: tracker in a new `features/hre-missions`, raids in `features/daily-raids`

The raid plan needs the eligibility, attempts, energy, filter and goal-need plumbing that is private to `daily-raids`. So `planMissionRaids` (pure, in a `.ts` file) and `HreRaidsSection` live there, next to `planEventFarm`. `daily-raids` exports them. The section takes `battlesToGo` and `missionNumber` as props.

`features/hre-missions` owns:

- instance selection
- mission resolution and wording
- local-storage progress
- tips
- token needs

It exports `useHreInstance`, `useHreProgress`, `MissionTracker`, `MissionGuidance`, `selectCampaignObjective` and `remainingCampaignBattles`.

`pages/dailies/ui/hre-page.tsx` composes both slices and passes the numbers between them, so no feature imports a sibling. The token buckets come from the synced player data entity, not from `home-screen-event-points`.

- _Alternative:_ extend `planEventFarm` with a "minimise energy" mode. That was rejected because its candidate rule ("earns points") and its order key are different, and mixing them would blur both specs.

### D3. Raid order: energy ascending, then goal value, then battle id

The objective is a battle count, so energy per battle is the only cost that matters. Indomitus I06 to I14 cost 3 energy, but they are capped at 3 attempts a day, so only 27 raids a day. After them, I15 to I29 cost 5 energy with the regular cap of 10. Every battle on these nodes is still 1 to 3 energy cheaper than on 6-energy nodes. HRE event points are about 3 per energy on any node (the wiki formula: 3 per energy, plus skulls and enemy power), so the cheap nodes cost nothing in points. Goal-needed drops break ties among equal costs, which is how "match my goals" is honoured without paying energy for it. The fill is the same greedy algorithm as `planEventFarm`, capped by battles to go instead of material need.

### D4. Progress storage

The key is `tp.dailies.hre.progress.v1`. The value is `{ [occurrenceId]: { mission: number, progress: [number, number] } }`. It is read and written through guarded `try` blocks, as in `use-hse-projection-inputs.ts`. Invalid entries are dropped on read. It is not keyed by account: the app is per-browser and the HSE keys behave the same way.

### D5. Layout, desktop and mobile

- **Desktop (≥768px):** the header row (hero, window, countdown, project select, Raids Filters, Planning Settings) sits above a two-column grid.
  - Left column: the mission tracker (current mission card with progress inputs, tips and the "Mission complete" action, then a compact list of all 21 missions).
  - Right column: the raid suggestions or the mission team (whichever the current mission needs), the remaining-campaign summary, the tokens-needed card and the pace card.
- **Mobile (<768px):** one column in this order: current mission card, then raid suggestions or the mission team, then tokens needed, then pace, then all missions. The full list is collapsed behind "All missions". The header controls collapse to icons, as on the HSE tab.

The tour targets differ only for the collapsed mission list. The mobile steps point at the "All missions" toggle instead of the list.

### D6. Featured-hero id

The Zapspitta occurrence uses the unit id `orksWeirdboy`, which is the unit named Zapspitta in `units-orks.json`. The API data fix corrects the existing Sekhetar Robot occurrence from `sekhetar-robot` to its unit id `thousSekhetar`. Any id that still does not resolve falls back as the spec describes.

### D7. Pace tables are app constants, and the chain is one pure function

The milestone, daily-payout, weekly-crate, chest and shard tables live in `features/hre-missions/model/hre-reward-tables.ts`. `projectHrePace(input)` returns one result with every intermediate value: projected points, currency by source, chest tier, shards by source, the step reached, and the target needs. The UI only reads that result, so the summary and the detail can never disagree. The inverse (target to points) walks the same tables. Points and rank share the D4 storage, in the same entry as mission progress.

### D8. Mission teams in `pages/dailies/model`, next to the HSE teams

`useHreTeamRecommendations` mirrors `useHseTeamRecommendations`. It reads the roster and the character catalog, and calls `buildTeamRecommendations` in Power mode with size 5:

- **All-alliance:** the roster is filtered by alliance.
- **Featured hero:** a priority pool holding only the featured hero, with `leadWithPools`.
- **Summon-free:** excludes the summoner set. That set is built once from the `npcAbilityText` English descriptions of each unit's active and passive abilities, where the text opens a `<style="Summon">` span after the verb "summon". The verb check skips abilities that only buff existing summons.

This stays in the page slice because only the Dailies page composes teams, as with HSE.

### D9. One running-HRE hook feeds the tab and the live dot

`useIsHreLive` lives in `features/hre-missions` and uses the same selection as the tab. `nav-live-dot.tsx` gains `liveIndicator: "hre"`, and the Dailies parent entry is live when either signal is.

## Risks / Trade-offs

- [Snowprint changes the mission list in a future event] → the change is one constant and its i18n keys. Every objective renders from kind and target, so the edit is small.
- [The "raids count as wins" assumption is wrong for some objective] → it is stated as a spec assumption, and the tip for `campaignWins` says manual wins also count.
- [Progress is only in this browser] → this is accepted, as Severyn asked. Entering progress takes two numbers.
- [The cheapest nodes may be hidden by Raids Filters] → this is respected on purpose. The empty state offers to open the filters.

- [The reward tables change in a game patch] → they are one constants file, and the wiki page is the source. The page labels the projection as an estimate.
- [The summon text heuristic misses or over-includes a unit] → a unit test pins known summoners (Hollan) and known non-summoners, and the exclusion only affects the summon-free mission's team.

## Migration Plan

The API data fix (the Zapspitta occurrence and the Sekhetar id) ships first, so the tab has a running event. Without it, the app shows the empty state. There is nothing to roll back beyond reverting either PR.
