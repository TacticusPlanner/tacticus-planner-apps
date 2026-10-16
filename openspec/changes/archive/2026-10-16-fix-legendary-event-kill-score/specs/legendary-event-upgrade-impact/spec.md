# Spec Delta

## MODIFIED Requirements

### Requirement: Lane reachable points

For a lane, the planner SHALL compute **reachable points** from the lane points model, the synced lane progress and the lane's teams:

- A team's **depth** is its stored depth for the current run (`currentLegendaryEventRun`) when one exists, else its Stage 5 clear estimate, else 0. Only its non-reserve members and the stored covered objectives its current members still derive count.
- Battle `b` (0-based) is **reached** when some team's depth is greater than `b`.
- Each reached battle contributes: the kill score left, `max(0, battlesPoints[b] − kill_b)` (the synced `encounterPoints`, 0 without an encounter); plus the high score left, `max(0, battlesPoints[b] − highScore_b)` (the synced high score, 0 without an encounter); plus `defeatAll[b]` when defeat-all is not cleared; plus the catalog score of each objective not cleared in `b` that a team reaching `b` covers.
- Battles no team reaches contribute 0.

Maybe clear and Stop here marks SHALL NOT change reachable points. Reachable points are event points, anchored to the synced progress and the teams' current depths, and are never stored.

Assumptions:

- A won battle awards its full kill score and its full high score, each `battlesPoints[b]`, matching earned points (`legendary-event-synced-progress`) and the token value.
- A team that reaches a battle wins it and satisfies every objective it covers there.
- An objective cleared once in a battle cannot be scored again in that battle.

#### Scenario: Worked example on Uthar Alpha

- **GIVEN** `votanUthar` Alpha (18 battles; `battlesPoints` 29, 31, 35, 39, 41, 43, 45…; `defeatAll` 30; objectives Ultramarines 75 (index 0), Resilient 95, Max 2 Hits 50, Melee 65 (index 3), Piercing 90), synced Alpha `encounters[0] = { objectivesCleared: [0, 1], highScore: 29, encounterPoints: 29 }` and `encounters[1] = { objectivesCleared: [0], highScore: 31, encounterPoints: 31 }`, and one Alpha team **Four** covering Ultramarines with depth 5
- **WHEN** reachable points are computed
- **THEN** battle 1 adds 0 (kill score 29 − 29, high score 29 − 29, defeat-all and Ultramarines cleared), battle 2 adds 75 (31 − 31, 31 − 31, defeat-all cleared, Ultramarines), battle 3 adds 35 + 35 + 30 + 75 = 175, battle 4 adds 39 + 39 + 30 + 75 = 183 and battle 5 adds 41 + 41 + 30 + 75 = 187
- **AND** the lane's reachable points are 620

#### Scenario: Overlapping teams count each objective once

- **GIVEN** the worked example plus a team **Melee** covering Ultramarines and Melee with a stored depth of 6
- **WHEN** reachable points are computed
- **THEN** battles 1 to 6 add 65, 140, 240, 248, 252 and 256, for 1,201 points; Ultramarines is counted once per battle although both teams cover it

### Requirement: Upgrade impact per lane

For each lane, the planner SHALL evaluate every next step of every distinct non-reserve member of the lane's teams:

1. Re-estimate each team of the lane holding that unit with the unit at its stepped state (Stage 5 calculation).
2. Set that team's depth after the step to `min(battleCount, depthBefore + (estimateAfter − estimateBefore))`, reading a missing estimate as 0. The estimate delta also moves a stored depth.
3. Set the step's **gain** to the lane's reachable points after the step minus before.

Steps with a gain of 0 SHALL be dropped. The rest SHALL be ordered by gain descending, then by the number of battles newly reached descending, then by localized unit name. Each row SHALL carry the unit, the step, each affected team's depth before and after, and the gain in event points. Upgrade impact is anchored to the synced roster plus one step, never to Goals Preview, and SHALL be recomputed whenever the roster, the plan, the synced progress or the estimates change.

#### Scenario: Worked example, one step reaches the next battle

- **GIVEN** `powerRatio` 0.5, `ultraTigurius` in a horde-mode tier with multiplier 1.2, the reachable-points worked example, and team **Four** = `ultraCalgar`, `ultraTigurius`, `ultraTitus`, `ultraApothecary` (Incisus) with no stored depth, where Calgar, Titus and Incisus are owned at Gold1, Epic:RedOneStar, 3 upgrades, active 20, passive 15 (combat power 8,792 each) and Tigurius at Gold1, Epic:RedTwoStars, 3 upgrades, active 20, passive 15 (combat power 9,299, effective 11,158.8)
- **WHEN** upgrade impact is computed for Alpha
- **THEN** Four's effective power is 3 × 8,792 + 11,158.8 = 37,534.8, which reaches battle 5 (threshold 20,293) and not battle 6 (37,893.5), so its depth is 5 and the lane has 620 reachable points
- **AND** no member has a Rank step (each is at Gold1, the Epic cap)
- **AND** Tigurius's Ascension to Epic:RedThreeStars (combat power 9,806, effective 11,767.2) makes Four's effective power 38,143.2, which reaches battle 6 and not battle 7 (67,301.5), so Four's depth becomes 6 and battle 6 adds 43 + 43 + 30 + 75 = 191: gain +191
- **AND** Calgar's Ascension to Epic:RedTwoStars (combat power 9,299) makes Four's effective power 38,041.8, depth 6, gain +191, and Titus's and Incisus's Ascensions give the same
- **AND** the list shows four rows of +191, each "Four: battle 5 → 6", ordered Calgar, Incisus, Tigurius, Titus

#### Scenario: A stored depth moves by the estimate delta

- **GIVEN** the worked example where Four has a stored depth of 4 for the current run
- **WHEN** upgrade impact is computed
- **THEN** reachable points before are 0 + 75 + 175 + 183 = 433; Tigurius's step raises Four's estimate from 5 to 6, so its depth becomes 4 + 1 = 5, battle 5 adds 187, and the row reads "+187, Four: battle 4 → 5"

#### Scenario: A battle another team already reaches adds nothing

- **GIVEN** the worked example plus team **Melee** (Calgar, Titus, Incisus; covering Ultramarines and Melee; stored depth 6)
- **WHEN** upgrade impact is computed
- **THEN** Tigurius's step lifts Four to battle 6, which Melee already reaches with Ultramarines covered, so its gain is 0; Calgar's step leaves Melee's estimate at 5 (26,883 is below 37,893.5), so Melee's depth stays 6 and the gain is 0
- **AND** no row is listed

#### Scenario: Unlocking a member that does not reach a new battle

- **GIVEN** team **Five** = Calgar, Tigurius (Epic:RedOneStar, effective 10,550.4), Titus, Incisus and Certus, where Certus is not owned, so its effective power is 36,926.4 and its depth 5
- **WHEN** upgrade impact is computed
- **THEN** unlocking Certus adds his base combat power 346, for 37,272.4, still below battle 6's 37,893.5, so no Unlock row is listed

### Requirement: Upgrade impact section on a lane tab

Each lane tab SHALL render an **Upgrade impact** section after the Teams section and before the Synced progress grid. It SHALL be collapsed by default and its open state SHALL be remembered per device. Its header SHALL always show a summary derived from the rows ("4 upgrades add points · best +191", or the empty-state reason). Each row SHALL show the unit's portrait, localized name and goal badge, the step ("Unlock", "Rank to Gold II", "Ascension to Epic 3 red stars"), each affected team's depth change ("Four: battle 5 → 6") and the gain ("+191 points"). It SHALL also show a **Create goal** action that opens the shell's goal-creation sheet prefilled for that step (see `goal-creation-entry-points`). When the unit already has an Active goal whose target is at or beyond the step, the row SHALL show "In goals" instead of Create goal. The section SHALL NOT render on Overview.

The body SHALL distinguish:

- estimates unavailable: "Needs clear estimates", per the `legendary-event-clear-estimates` data states;
- no teams on the lane: "Add a team to see which upgrades add points";
- no positive rows: "No single next step adds points on this lane";
- loading: a skeleton.

#### Scenario: Collapsed by default with a summary

- **GIVEN** the worked example
- **WHEN** the Alpha tab renders for the first time on a device
- **THEN** the Upgrade impact header reads "4 upgrades add points · best +191" and the rows are hidden until it is expanded

#### Scenario: Create goal from a row

- **WHEN** the user activates Create goal on Tigurius's row
- **THEN** the goal-creation sheet opens with Tigurius selected, goal type Ascension and target Epic:RedThreeStars

#### Scenario: Row already in goals

- **GIVEN** Tigurius has an Active Ascension goal to Legendary:RedThreeStars
- **WHEN** his row renders
- **THEN** it shows "In goals" and no Create goal action

#### Scenario: No teams

- **GIVEN** Beta has no teams
- **WHEN** the Beta tab renders
- **THEN** the section header reads "Add a team to see which upgrades add points"

#### Scenario: Desktop rows

- **WHEN** the section is expanded at or above 768px
- **THEN** each step is one row with columns unit, step, teams, points and a labelled Create goal button, with no horizontal page scroll

#### Scenario: Mobile rows

- **WHEN** the section is expanded below 768px
- **THEN** each step is a two-line card (unit and step, then teams and points) with an icon Create goal button whose accessible name includes the unit's name, with a touch target of at least 44px
