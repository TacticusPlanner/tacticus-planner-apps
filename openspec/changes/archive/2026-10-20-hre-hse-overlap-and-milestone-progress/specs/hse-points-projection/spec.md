## MODIFIED Requirements

### Requirement: The projection shows what reaching the final milestone takes

The projection SHALL show: the target (the resolved tier's final cumulative milestone); points so far (running events only) and the remaining points `max(0, target - pointsSoFar)`; per mode its tokens, its unit (kills for `KillUnits`, waves for `DefeatWaves`, battles for `DeployedUnitsOfFactionMajority` and `FullLineUpOfFaction`) and its points per unit (the sum of the points of every tracker whose `gameModes` pass the mode, stated as assuming each unit matches all of them); the units to defeat to reach the final milestone, `ceil(remaining / pointsPerUnit)`, when every shown mode has the same unit and points per unit; and the required average per token, `remaining / sum(tokens x pointsPerUnit)` rounded up to one decimal, expressed in that shared unit or otherwise in event points per token.

Points so far SHALL come from two inputs that match how the game shows progress, which restarts at 0 after each milestone: the milestones completed (default 0; each repeat past the final milestone counts as one, up to the repeat `cap`) and the points in the current milestone (default 0), shown against that milestone's points (its cumulative points minus the previous milestone's, or the repeat step). Points so far SHALL be the cumulative points of the completed milestones (plus one repeat step per repeat) plus the points in the current milestone, capped at that milestone's points. Once every milestone and capped repeat is done, the points input SHALL be replaced by a note that every milestone is done. The total SHALL be shown beside the inputs.

Assumptions:

- Points per unit come only from served trackers; enemy-side restrictions (For the Emperor, Squig Smash) are stated, not modelled.
- A battle-unit mode scores once per token (one battle per token, one full line-up of one faction).

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

- **GIVEN** Faction Focus, whose trackers give 1 + 2 = 3 points per Arena battle and 3 + 5 = 8 per Onslaught and Salvage Run battle
- **THEN** no units-to-defeat figure is shown and the required average is in event points per token

#### Scenario: Target already reached

- **GIVEN** 19 milestones done (765, the final) and 35 of the first 50-point repeat, so 800 points so far, and target 765
- **THEN** remaining is 0 and the projection says the final milestone is reached, with repeats counted from the repeat step

#### Scenario: Points in a milestone are capped

- **GIVEN** Psyker Boost High, 0 milestones done and 35 entered for the 20-point first milestone
- **THEN** points so far are 20

### Requirement: Average per token projects the milestone reached

Each shown mode SHALL have an editable average units per token, defaulting to 5 kills for Arena, 20 kills for Onslaught and 12 kills for Salvage Run, empty for waves, and fixed at 1 for battles. Projected points SHALL be `pointsSoFar + sum(tokens x average x pointsPerUnit)`; the projection SHALL show them with the number of milestones reached of the total, the points to the next milestone, and, past the final milestone, the number of repeat steps reached (`floor((projected - target) / repeatStep)`, capped by `cap`). With an empty average in any mode the projected points SHALL NOT be shown and the mode SHALL ask for its average. Averages SHALL persist per browser per event definition and mode; the milestone progress SHALL persist per instance; neither is shared with other Dailies tabs.

Assumptions:

- Kill defaults are rough estimates (Arena: five enemies per battle; Onslaught and Salvage Run per Severyn) and are meant to be edited.

#### Scenario: Upcoming Psyker Boost projection

- **GIVEN** tokens 58 / 15 / 14 and the default averages 5 / 20 / 12
- **THEN** projected points are 58 x 5 + 15 x 20 + 14 x 12 = 290 + 300 + 168 = 758, reaching 18 of 19 milestones (705), 7 points short of 765

#### Scenario: Running Psyker Boost projection

- **GIVEN** 300 points so far (10 milestones and 30 points), tokens 28 / 7 / 8 and the default averages
- **THEN** projected points are 300 + 140 + 140 + 96 = 676, reaching 17 of 19 milestones (645), 29 points to the next (705)

#### Scenario: Past the final milestone

- **GIVEN** projected points 880 on the High tier
- **THEN** all 19 milestones are reached and floor((880 - 765) / 50) = 2 repeat steps

#### Scenario: Edited average persists

- **WHEN** the player sets Onslaught to 25 kills per token on Psyker Boost and reloads
- **THEN** Onslaught shows 25 for Psyker Boost and still 20 for Flying Boost

#### Scenario: Waves need an average

- **GIVEN** Defeat Waves with no average entered
- **THEN** the required average in waves per token is shown, and the projected points are not, until an average is entered for each mode
