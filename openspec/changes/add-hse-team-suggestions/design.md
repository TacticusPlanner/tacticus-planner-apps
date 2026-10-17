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
- A tracker without a `player` filter (11th edition weeks, Defeat Waves) makes no pool: the team is the strongest of the mode-eligible roster, marked "any unit scores".
- `DeployedUnitsOfFactionMajority` / `FullLineUpOfFaction` (Faction Focus): per team, the event-unit pool is the faction whose five strongest owned characters in the mode-eligible roster have the highest summed combat power (ties by faction id); the rationale names the faction.

### D3. Engine configuration

`{ mode: "power", teamSize: 5, roster: modeEligible, pools: [{ id: "event-units", unitIds, rationale: "event-unit" }], preferences: none, locks: none, seed: 0 }`. The engine appends the full roster, so a pool with fewer than five event units is filled with the strongest others and the team is marked broadened. Onslaught and Salvage Run narrow `modeEligible` to the alliance first, as their pages do.

### D4. Layout

Desktop: Arena card, then an Onslaught row and a Salvage Run row of three alliance cards each. Mobile: a segmented control (Arena / Onslaught / Salvage Run) and, under it, the mode's cards stacked (one for Arena, three for the others). The segmented choice is local state, not persisted. Tour target `hse-teams` on both.

## Risks

- Power mode ignores XP; Psyker Boost's 3x XP for Psykers is still earned because Psykers lead the team.
