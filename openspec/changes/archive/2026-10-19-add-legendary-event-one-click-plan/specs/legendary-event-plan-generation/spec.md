# Spec Delta

## ADDED Requirements

### Requirement: Points target for a chosen ascension step

For a chosen step of the event unit (any step after its synced progression: `unlock`, `fourStars`, `fiveStars`, `blueStar`, and later steps the catalog defines), the planner SHALL compute the points target exactly as the reward projection does for the next step (`legendary-event-reward-projection`), with the chosen step's cumulative shard threshold in place of the next step's. Steps already reached SHALL NOT be offered.

#### Scenario: Unlock on Uthar

- **GIVEN** the reward projection's worked Uthar example (P 5,000, C 120, K 10, S 250, run 3 inputs 10 missions and the bundle, unit not owned)
- **WHEN** the target for Unlock is computed
- **THEN** it equals the projection: 16 chests, 1,180 currency from points, milestone 22 at 10,000 points, 5,000 points to go

#### Scenario: Step beyond the ladder

- **GIVEN** a step whose chests required exceed the event's chest count
- **WHEN** its target is computed
- **THEN** it is "not reachable this event"

### Requirement: Ceiling and verdict per step

The planner SHALL compute a roster's **ceiling** as the run forecast's ending points for the last run (`legendary-event-run-forecast`) when the token plan is built from the teams generated for that roster (see team generation), each token played at the depth its team has in the run the token falls in. A run in which no team can play leaves the rest of that run's tokens unplanned; planning carries on with the next run's tokens. Each offered step SHALL get a verdict:

- **Reachable now** when its points target ≤ the ceiling of the synced roster (or "enough currency now");
- **Needs upgrades** when it is not, and its points target ≤ the ceiling with every recommended upgrade;
- **Too ambitious** otherwise, or when not reachable this event.

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

### Requirement: Upgrade recommendations close the shortfall

The planner SHALL recommend upgrade goals greedily, once per draft economy, until nothing adds ceiling or 12 recommendations are chosen:

1. candidates are chains of one to three consecutive next steps (`legendary-event-upgrade-impact`: Unlock, Rank, Ascension) of a unit, applied on top of the unit's recommendations already chosen, for the lanes' current team members, the four strongest owned units per objective and the two locked units per objective with the most points per battle (a single step rarely moves a team a battle, so chains are needed);
2. a candidate's farming days are the goal farming estimate of the unit's chain from its synced state; its ready date is the previous recommendation's ready date plus those days (recommendations are farmed in order), and it counts only for runs starting after that date. A candidate that helps no run is dropped;
3. each candidate's score is the ceiling gain over the current selection divided by its farming days (at least 1);
4. the highest score is chosen; ties prefer the higher master table total across all served events, then the higher horde-mode multiplier, then the localized name.

A step's recommendations SHALL be the list's prefix up to the first one whose ceiling reaches the step's target (all of them when none does; none when Reachable now). A unit's Active goal that already covers a candidate SHALL be reused (shown as "already planned") instead of creating a new one. Each recommendation SHALL report its unit, steps, the ceiling gain, its ready date and the first run it helps.

#### Scenario: Goal ready too late is dropped

- **GIVEN** run 3 starts on 15 April 2027 (estimated) and a candidate Rank goal is estimated to finish on 1 May 2027
- **WHEN** recommendations are computed
- **THEN** the candidate is not recommended

#### Scenario: Existing goal reused

- **GIVEN** Tigurius has an Active Ascension goal to Legendary:RedThreeStars and that step is the best candidate
- **WHEN** recommendations are computed
- **THEN** it is listed as already planned and no new goal is created for it

#### Scenario: Tie prefers wider value

- **GIVEN** two candidates with equal scores whose units have master table totals 11,538 and 9,200
- **WHEN** one is chosen
- **THEN** it is the 11,538 unit's

### Requirement: Teams are generated per lane for each run's roster

For each lane and each run that is not Done, the planner SHALL build a team set on that run's **projected roster** (the synced roster plus every chosen goal estimated to finish before the run's start, applied as Goals Preview does): starting from the lane's existing teams (none when the user chose Replace my teams), repeatedly add the team suggestion (`legendary-event-team-suggestions`, Only unlocked on, on the projected roster) with the highest gain until none gains or the lane holds 6 teams. A generated team's depth for each run SHALL be its clear estimate on that run's projected roster.

#### Scenario: Keep existing teams

- **GIVEN** Alpha already has team Melee and the user keeps their teams
- **WHEN** teams are generated
- **THEN** Melee stays first on Alpha and generated teams are added after it

#### Scenario: Later run gets a deeper team

- **GIVEN** a chosen Rank goal for Calgar finishing before run 3
- **WHEN** teams are generated
- **THEN** a team holding Calgar has run 3's depth from the upgraded Calgar and run 2's from the synced one
