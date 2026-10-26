## ADDED Requirements

### Requirement: Tournament Arena tokens are entered by the player

When a tracker of a running or upcoming `Personal` variant scores in Tournament Arena (its `gameModes` pass `TournamentArena`), the projection SHALL show Tournament Arena as a mode between Arena and Onslaught, with the same unit and points-per-unit rules as the other modes. Because the player data has no Tournament Arena token bucket, its tokens SHALL come from a whole-number input in that mode's row (desktop: the tokens cell; mobile: the row header), defaulting to 0, never from the sync, and the mode SHALL never be left out as not unlocked. A note SHALL say that Tournament Arena tokens are not synced and ask for the number the player will spend during the event.

Assumptions:

- Tournament Arena spends exactly one token per battle.
- A Faction Focus Tournament Arena battle scores like an Arena battle (served trackers).
- The player knows how many Tournament Arena tokens they will spend during the event; the planner does not model Tournament Arena regeneration.

#### Scenario: Upcoming Faction Focus with Tournament Arena tokens

- **GIVEN** Faction Focus (october-2026, target 1220), upcoming, synced tokens Arena 58, Onslaught 15, Salvage Run 14, and 20 Tournament Arena tokens entered
- **THEN** the modes are Arena (7 per battle), Tournament Arena (7 per battle), Onslaught (20) and Salvage Run (20); projected points are 58 x 7 + 20 x 7 + 15 x 20 + 14 x 20 = 406 + 140 + 300 + 280 = 1126; the required average is 1220 / (58 + 20 + 15 + 14) = 1220 / 107 = 11.40, shown as 11.5 event points per token

#### Scenario: No Tournament Arena tokens entered

- **GIVEN** the same event with nothing entered for Tournament Arena
- **THEN** the Tournament Arena row shows 0 points, the projected points are 986 and the required average is 1220 / 87 = 14.02, shown as 14.1 event points per token, with the note that Tournament Arena tokens are not synced

### Requirement: Tournament Arena counts like the other modes

Tournament Arena tokens SHALL count in the required average per token and the projected points like any other mode's. Its average SHALL default to 5 kills for a kill-based event and be fixed at 1 for a battle-based event. Entered tokens SHALL persist per browser per instance and are not shared with other Dailies tabs. The HSE event teams SHALL NOT add a Tournament Arena team; the Arena team covers it.

#### Scenario: Entered tokens persist per instance

- **WHEN** the player enters 12 Tournament Arena tokens for this Faction Focus and reloads
- **THEN** the input shows 12 for this instance and is empty for another instance

#### Scenario: Event that does not score in Tournament Arena

- **GIVEN** Psyker Boost, whose trackers do not allow Tournament Arena
- **THEN** no Tournament Arena row and no "not synced" note are shown

## MODIFIED Requirements

### Requirement: The projection shows what reaching the final milestone takes

The projection SHALL show: the target (the resolved tier's final cumulative milestone); points so far (running events only) and the remaining points `max(0, target - pointsSoFar)`; per mode its tokens, its unit (kills for `KillUnits`, waves for `DefeatWaves`, battles for `DeployedUnitsOfFactionMajority` and `FullLineUpOfFaction`) and its points per unit (the sum of the points of every tracker whose `gameModes` pass the mode, stated as assuming each unit matches all of them, with a `DeployedUnitsOfFactionMajority` tracker counted once per character of a full five-character line-up); the units to defeat to reach the final milestone, `ceil(remaining / pointsPerUnit)`, when every shown mode has the same unit and points per unit; and the required average per token, `remaining / sum(tokens x pointsPerUnit)` rounded up to one decimal, expressed in that shared unit or otherwise in event points per token.

Points so far SHALL come from two inputs that match how the game shows progress, which restarts at 0 after each milestone: the milestones completed (default 0; each repeat past the final milestone counts as one, up to the repeat `cap`) and the points in the current milestone (default 0), shown against that milestone's points (its cumulative points minus the previous milestone's, or the repeat step). Changing the milestones completed SHALL reset the points in the current milestone to 0, as the game does. Points so far SHALL be the cumulative points of the completed milestones (plus one repeat step per repeat) plus the points in the current milestone, capped at that milestone's points. Once every milestone and capped repeat is done, the points input SHALL be replaced by a note that every milestone is done. The total SHALL be shown beside the inputs.

Assumptions:

- Points per unit come only from served trackers; enemy-side restrictions (For the Emperor, Squig Smash) are stated, not modelled.
- A battle-unit mode scores once per token (one battle per token) with a full line-up of five characters from one faction (Machines of War never count): a faction-majority tracker scores once per deployed character of that faction, a full line-up tracker once per battle.

#### Scenario: Upcoming Psyker Boost requirement

- **GIVEN** High tier (target 765), no points so far, tokens 58 / 15 / 14 and 1 point per kill in every mode
- **THEN** remaining is 765, units to defeat is ceil(765 / 1) = 765 kills, and the required average is 765 / (58 + 15 + 14) = 765 / 87 = 8.79, shown as 8.8 kills per token

#### Scenario: Running Psyker Boost with points so far

- **GIVEN** target 765, 10 milestones done (270 points) and 30 of the 11th milestone's 50 points, so 300 points so far, tokens 28 / 7 / 8
- **THEN** remaining is 465, units to defeat 465 kills, required average 465 / 43 = 10.81, shown as 10.9 kills per token

#### Scenario: Several trackers in a mode

- **GIVEN** Faction Boost, Dark Angels variant, High tier (target 1000), whose Arena trackers give 2 points per kill by an Imperial unit and 1 per kill by a Dark Angels unit
- **THEN** Arena has 3 points per kill with the note that a kill by a Dark Angels unit matches both, and units to defeat is ceil(1000 / 3) = 334 kills

#### Scenario: Battle-based event

- **GIVEN** Faction Focus, whose trackers give 1 point per majority-faction character plus 2 for a full line-up of one faction in Arena, and 3 per character plus 5 in Onslaught and Salvage Run
- **THEN** Arena scores 5 x 1 + 2 = 7 per battle and Onslaught and Salvage Run 5 x 3 + 5 = 20 per battle, as the game's maximums; no units-to-defeat figure is shown and the required average is in event points per token

#### Scenario: Target already reached

- **GIVEN** 19 milestones done (765, the final) and 35 of the first 50-point repeat, so 800 points so far, and target 765
- **THEN** remaining is 0 and the projection says the final milestone is reached, with repeats counted from the repeat step

#### Scenario: Points in a milestone are capped

- **GIVEN** Psyker Boost High, 0 milestones done and 35 entered for the 20-point first milestone
- **THEN** points so far are 20

#### Scenario: A new milestone restarts the points

- **GIVEN** 3 milestones done and 15 points in the fourth
- **WHEN** the player changes the milestones done to 4
- **THEN** the points in the current milestone are 0
