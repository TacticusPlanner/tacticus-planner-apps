# Design

## Context

The shared engine `buildTeamRecommendations` (in `pages/dailies/model/team-recommendations.ts`) takes a mode, team size, a mode-eligible roster, ordered priority pools and preferences, and returns a Plan team and a Random team. Salvage Run and Onslaught narrow the roster to one alliance before calling it. The HSE page lives in the same `pages/dailies` slice, so it can call the engine directly. Scoring (variant, trackers) comes from `features/home-screen-event-points` (`add-hse-points-projection`).

## Decisions

### D1. Power mode, Plan team only, size 5

Severyn's call: only Power mode, no switch. The section shows the engine's Plan team only (the Random team needs Regenerate and locks, which would be noise here) and a fixed size of 5. Preference filters are not offered.

### D2. Event units per mode

For mode `m`, take the trackers whose `gameModes` pass `m` and that count a kill, wave or line-up by the player's units:

- A tracker with a `player` filter makes event units every owned character passing it (`tags` against traits and alliance, `factionIds` against faction; `MachineOfWar` disallowed is implicit because the engine picks characters only). With several trackers the union is taken, and characters passing more of them rank first inside the pool (Faction Boost: Dark Angels units satisfy both trackers).
- Line-up trackers are handled by the last rule below, whatever their filter. A `player` filter that only disallows `MachineOfWar` counts as no filter.
- When no scoring tracker of the mode has a `player` filter (11th Edition Week 2, Defeat Waves) there is no pool: the team is the strongest of the mode-eligible roster, marked "any unit scores".
- Mixed mode: when some scoring trackers narrow the units and at least one has no narrowing `player` filter (11th Edition Week 3 in Arena: 3 points per kill by any unit plus 1 per kill by a Blood Angels or Orks unit), every unit scores and the filtered characters only score more. The filtered set is then a ranking bonus only: the pool is the whole mode-eligible roster with the filtered characters (by how many trackers they pass) ranked first, so the team is never marked broadened, and members who match no filter get the `event-unit` rationale without a named match ("Scores for the event").
- `DeployedUnitsOfFactionMajority` / `FullLineUpOfFaction` (Faction Focus): per team, the event-unit pool is one faction of the mode-eligible roster. A full line-up of one faction needs five characters, so factions with at least five eligible owned characters rank first; among those (or among all when none has five) the faction whose five strongest sum to the highest combat power wins, ties by faction id. The rationale names the faction. When no faction has five, the team is filled with the strongest others and marked broadened with a faction-specific line: line-up points are per battle and need a full team of one faction, and fewer than five of that faction are owned.

### D3. Engine configuration

`{ mode: "power", teamSize: 5, roster: modeEligible, pools: [{ id: "event-units", unitIds, rationale: "event-unit" }], preferences: none, locks: none, seed: 0 }`. The engine appends the full roster, so a pool with fewer than five event units is filled with the strongest others and the team is marked broadened. Onslaught and Salvage Run narrow `modeEligible` to the alliance first, as their pages do.

### D4. Layout

Desktop: Arena card, then an Onslaught row and a Salvage Run row of three alliance cards each. Mobile: a segmented control (Arena / Onslaught / Salvage Run) and, under it, the mode's cards stacked (one for Arena, three for the others). The segmented choice is local state, not persisted. Tour target `hse-teams` on both.

## Risks

- Power mode ignores XP; Psyker Boost's 3x XP for Psykers is still earned because Psykers lead the team.
