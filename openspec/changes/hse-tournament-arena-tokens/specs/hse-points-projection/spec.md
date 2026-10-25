## ADDED Requirements

### Requirement: Tournament Arena tokens are entered by the player

When a tracker of a running or upcoming `Personal` variant scores in Tournament Arena (its `gameModes` pass `TournamentArena`), the projection SHALL show Tournament Arena as a mode between Arena and Onslaught, with the same unit and points-per-unit rules as the other modes. Because the player data has no Tournament Arena token bucket, its tokens SHALL come from a whole-number input in that mode's row (desktop: the tokens cell; mobile: the row header), defaulting to 0, never from the sync, and the mode SHALL never be left out as not unlocked. A note SHALL say that Tournament Arena tokens are not synced and ask for the number the player will spend during the event.

Assumptions:

- Tournament Arena spends exactly one token per battle.
- A Faction Focus Tournament Arena battle scores like an Arena battle: 1 point for a majority of one faction plus 2 for a full line-up of one faction (served trackers).
- The player knows how many Tournament Arena tokens they will spend during the event; the planner does not model Tournament Arena regeneration.

#### Scenario: Upcoming Faction Focus with Tournament Arena tokens

- **GIVEN** Faction Focus (october-2026, target 1220), upcoming, synced tokens Arena 58, Onslaught 15, Salvage Run 14, and 20 Tournament Arena tokens entered
- **THEN** the modes are Arena (3 per battle), Tournament Arena (3 per battle), Onslaught (8) and Salvage Run (8); projected points are 58 x 3 + 20 x 3 + 15 x 8 + 14 x 8 = 174 + 60 + 120 + 112 = 466; the required average is 1220 / (58 + 20 + 15 + 14) = 1220 / 107 = 11.40, shown as 11.5 event points per token

#### Scenario: No Tournament Arena tokens entered

- **GIVEN** the same event with nothing entered for Tournament Arena
- **THEN** the Tournament Arena row shows 0 points, the projected points are 406 and the required average is 1220 / 87 = 14.02, shown as 14.1 event points per token, with the note that Tournament Arena tokens are not synced

### Requirement: Tournament Arena counts like the other modes

Tournament Arena tokens SHALL count in the required average per token and the projected points like any other mode's. Its average SHALL default to 5 kills for a kill-based event and be fixed at 1 for a battle-based event. Entered tokens SHALL persist per browser per instance and are not shared with other Dailies tabs. The HSE event teams SHALL NOT add a Tournament Arena team; the Arena team covers it.

#### Scenario: Entered tokens persist per instance

- **WHEN** the player enters 12 Tournament Arena tokens for this Faction Focus and reloads
- **THEN** the input shows 12 for this instance and is empty for another instance

#### Scenario: Event that does not score in Tournament Arena

- **GIVEN** Psyker Boost, whose trackers do not allow Tournament Arena
- **THEN** no Tournament Arena row and no "not synced" note are shown
