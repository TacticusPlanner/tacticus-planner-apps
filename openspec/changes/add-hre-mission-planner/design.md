# Design

## Context

- The catalog has a `new-character-event` definition (`type: NewCharacterEvent`, parameter `featuredCharacterId`). It has a single authored occurrence: Sekhetar Robot, 2026-08-09, whose id `sekhetar-robot` is not a unit id. There are no Nubari or Zapspitta occurrences and no mission data.
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
- Mission lists as data, so that each new HRE is a catalog edit, not a code change.

**Non-Goals:**
- Event points, currency, chest-tier or leaderboard pace (for example, the 30,000-point target for Epic). This is a possible follow-up change.
- Team suggestions for the all-alliance or summon-free missions.
- Legendary-character events, which have a different structure.
- A live nav indicator or an instance switcher for past HREs.
- Syncing progress across devices.

## Decisions

### D1. Mission data lives in the API catalog, merged into the definition's `config.hre`

The raw `new-character-event-missions.json` has:
- `defaultMissions`: the 21-entry template from the wiki
- `missionsByOccurrence`: `{ [occurrenceId]: Mission[] }`, for events that deviate, such as Zapspitta's swapped objectives in missions 7, 9 and 10

`EventsDenormalizer` merges it into `config.hre` on the `new-character-event` definition. This is the same pattern as `config.hse`.

A mission is `{ number: 1..21, objectives: [Objective, Objective] }`. An objective is `{ kind, target, qualifier? }`:
- `kind` is one of `campaignWins`, `campaignRaids`, `arenaBattles`, `guildRaids`, `onslaught`, `salvageRuns`, `lightningVictories`, `killEnemies`, `killWithMelee`, `killWithRanged`, `killWithAlliance`, `killFaction`, `damage`, `abilityDamage`, `damageType`, `featuredDamage`, `useAbilities`, `useAbilitiesAlliance`, `useAbilitiesFeatured`, `heal`, `winWithoutSummons` or `winWithAllianceLineup`.
- `qualifier` is `{ alliance: "featured" }`, `{ faction }` or `{ damageType }`.

The alliance is resolved in the app from the featured hero, so one template serves every event.
- *Alternative:* hard-code the list in the app. That was rejected because every HRE would need an app release, and the mission lists already differ between events.
- *Alternative:* put the list on occurrence `parameters`. That was rejected because parameters are scalar strings.

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
- *Alternative:* extend `planEventFarm` with a "minimise energy" mode. That was rejected because its candidate rule ("earns points") and its order key are different, and mixing them would blur both specs.

### D3. Raid order: energy ascending, then goal value, then battle id

The objective is a battle count, so energy per battle is the only cost that matters. Indomitus I06 to I14 (3 energy, 90 raids a day) clear a 250-battle mission for 750 energy, against 1,500 on 6-energy nodes. HRE event points are about 3 per energy on any node (the wiki formula: 3 per energy, plus skulls and enemy power), so the cheap nodes cost nothing in points. Goal-needed drops break ties among equal costs, which is how "match my goals" is honoured without paying energy for it. The fill is the same greedy algorithm as `planEventFarm`, capped by battles to go instead of material need.

### D4. Progress storage

The key is `tp.dailies.hre.progress.v1`. The value is `{ [occurrenceId]: { mission: number, progress: [number, number] } }`. It is read and written through guarded `try` blocks, as in `use-hse-projection-inputs.ts`. Invalid entries are dropped on read. It is not keyed by account: the app is per-browser and the HSE keys behave the same way.

### D5. Layout, desktop and mobile

- **Desktop (≥768px):** the header row (hero, window, countdown, project select, Raids Filters, Planning Settings) sits above a two-column grid.
  - Left column: the mission tracker (current mission card with progress inputs, tips and the "Mission complete" action, then a compact list of all 21 missions).
  - Right column: the raid suggestions, the remaining-campaign summary and the tokens-needed card.
- **Mobile (<768px):** one column in the order current mission card, raid suggestions, tokens needed, then all missions. The full list is collapsed behind "All missions". The header controls collapse to icons, as on the HSE tab.

The tour targets differ only for the collapsed mission list. The mobile steps point at the "All missions" toggle instead of the list.

### D6. Featured-hero id

The Zapspitta occurrence uses the unit id `orksWeirdboy`, which is the unit named Zapspitta in `units-orks.json`. The API change corrects the existing Sekhetar Robot occurrence from `sekhetar-robot` to its unit id `thousSekhetar`. Any id that still does not resolve falls back as the spec describes.

## Risks / Trade-offs

- [The mission list changes between events] → it is per-occurrence data. The default template is only a fallback, and the page shows the catalog's text, so a missed edit shows wrong targets and not a crash.
- [The "raids count as wins" assumption is wrong for some objective] → it is stated as a spec assumption, and the tip for `campaignWins` says manual wins also count.
- [Progress is only in this browser] → this is accepted, as Severyn asked. Entering progress takes two numbers.
- [The cheapest nodes may be hidden by Raids Filters] → this is respected on purpose. The empty state offers to open the filters.

## Migration Plan

The API half applies first: dataset, merge and occurrences. The app tolerates a missing `config.hre` with the "Mission list not available" state, so the app half can still deploy safely if the API half lags. There is nothing to roll back beyond reverting either PR.
