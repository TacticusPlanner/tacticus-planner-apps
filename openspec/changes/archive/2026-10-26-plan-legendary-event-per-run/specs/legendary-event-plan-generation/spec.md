## MODIFIED Requirements

### Requirement: Points target for a chosen ascension step

For a chosen step of the event unit (any step after its synced progression: `unlock`, `fourStars`, `fiveStars`, `blueStar`, and later steps the catalog defines) and the plan's **horizon** run, the planner SHALL compute the points target exactly as the reward projection does for the next step (`legendary-event-reward-projection`), with the chosen step's cumulative shard threshold in place of the next step's and only the future runs up to the horizon counted for missions, bundles and close shards. Steps already reached SHALL NOT be offered.

#### Scenario: Unlock on Uthar

- **GIVEN** the reward projection's worked Uthar example (P 5,000, C 120, K 10, S 250, run 3 inputs 10 missions and the bundle, unit not owned) and the horizon run 3
- **WHEN** the target for Unlock is computed
- **THEN** it equals the projection: 16 chests, 1,180 currency from points, milestone 22 at 10,000 points, 5,000 points to go

#### Scenario: Step beyond the ladder

- **GIVEN** a step whose chests required exceed the event's chest count
- **WHEN** its target is computed
- **THEN** it is "not reachable by the end of this run"

#### Scenario: Missions after the horizon do not count

- **GIVEN** run 2 is the next run, run 3 has 10 missions planned and the horizon is run 2
- **WHEN** a step's target is computed
- **THEN** run 3's mission currency is not counted

### Requirement: Ceiling and verdict per step

The planner SHALL compute a roster's **ceiling** as the run forecast's ending points for the horizon run (`legendary-event-run-forecast`) when the token plan is built from the teams generated for that roster (see team generation), each token played at the depth its team has in the run the token falls in. A run in which no team can play leaves the rest of that run's tokens unplanned; planning carries on with the next run's tokens. Each offered step SHALL get a verdict:

- **Reachable now** when its points target ≤ the ceiling of the synced roster (or "enough currency now");
- **Needs upgrades** when it is not, and its points target ≤ the ceiling with every recommended upgrade;
- **Too ambitious** otherwise, or when not reachable by the end of the horizon run.

Each verdict SHALL carry the points short ("3,864 points short with your roster") and a Too ambitious step SHALL name the highest step that is not Too ambitious.

#### Scenario: Unlock needs upgrades

- **GIVEN** the Unlock target of 10,000 points and a synced roster whose generated teams score only on Alpha, giving a ceiling of 6,136 points (the worked token plan)
- **AND** the recommended upgrades raise the ceiling to 10,450
- **WHEN** the verdict is computed
- **THEN** Unlock is Needs upgrades, "3,864 points short with your roster"

#### Scenario: Too ambitious names the best step

- **GIVEN** Blue star's target exceeds the ceiling with every recommended upgrade and Five stars' does not
- **WHEN** the verdicts are computed
- **THEN** Blue star is Too ambitious with "Five stars is the highest step within reach"

#### Scenario: Ceiling at an earlier horizon

- **GIVEN** the forecast ends run 2 on 9,000 points and run 3 on 15,000
- **WHEN** the horizon is run 2
- **THEN** the ceiling is 9,000
