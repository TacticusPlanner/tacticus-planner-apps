# legendary-event-upgrade-impact Specification

## Purpose

Defines lane reachable points (the event points a lane's teams can still earn within their depths), the next upgrade steps of a team member, how much each step adds to a lane, the Upgrade impact section on a lane tab with its Create goal action, and its tour step.

## Requirements

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

### Requirement: Next upgrade steps of a team member

For a unit, the planner SHALL list its **next steps**:

- **Unlock**, when the synced roster lacks the unit, to its base state (the first progression step of its catalog `initialRarity`, rank Stone1, no applied upgrades, abilities 1/1);
- **Rank**, when owned, to the next rank on the ladder with 0 applied upgrades, only when that rank is at most `maxRankForProgression` of the unit's current progression;
- **Ascension**, when owned, to the next step of `progressionOrder`, unless the unit is at the last step.

Ability levels and equipment are unchanged by every step.

Assumptions:

- A rank-up starts the new rank with no applied upgrades.
- The highest rank a rarity allows is Iron1 for Common, Bronze1 for Uncommon, Silver1 for Rare, Gold1 for Epic, Diamond3 for Legendary and Adamantine2 for Mythic.
- Ascension advances one step of the 20-step progression path (a star or a rarity).

#### Scenario: Rarity-capped rank

- **GIVEN** Tigurius owned at Gold1, Epic:RedTwoStars
- **WHEN** his next steps are listed
- **THEN** they are Ascension to Epic:RedThreeStars only, because Gold1 is the highest rank Epic allows

#### Scenario: Locked unit

- **GIVEN** Certus is not in the roster
- **WHEN** his next steps are listed
- **THEN** the only step is Unlock, to Stone1, Common:None

### Requirement: Upgrade impact per lane

For each lane, the planner SHALL evaluate every next step of every distinct non-reserve member of the lane's teams:

1. Re-estimate each team of the lane holding that unit with the unit at its stepped state (Stage 5 calculation).
2. Set that team's depth after the step to `min(battleCount, depthBefore + (estimateAfter − estimateBefore))`, reading a missing estimate as 0. The estimate delta also moves a stored depth.
3. Set the step's **gain** to the lane's reachable points after the step minus before.

Steps with a gain of 0 SHALL be dropped. The rest SHALL be ordered by gain descending, then by the number of battles newly reached descending, then by localized unit name. Each row SHALL carry the unit, the step, each affected team's depth before and after, and the gain in event points. Upgrade impact is anchored to the synced roster plus one step, never to Goals Preview, and SHALL be recomputed whenever the roster, the plan, the synced progress or the estimates change.

Power in every re-estimate is the `character-combat-power` estimate of the unit at its stepped state, with its synced equipped items (none for a unit being unlocked).

#### Scenario: Worked example, one step reaches the next battle

- **GIVEN** `powerRatio` 1.2, `ultraTigurius` in a horde-mode tier with multiplier 1.2, the reachable-points worked example, and team **Four** = `ultraCalgar`, `ultraTigurius`, `ultraTitus`, `ultraApothecary` (Incisus) with no stored depth. Calgar, Titus and Incisus are owned at Gold1, Epic:RedOneStar, slots 0 to 2 applied, active 20, passive 15, no items (power 21,675, 21,883 and 24,753). Tigurius is at Gold1, Epic:RedTwoStars, with the same slots and levels (power 18,557, effective 22,268.4)
- **WHEN** upgrade impact is computed for Alpha
- **THEN** Four's effective power is 21,675 + 21,883 + 24,753 + 22,268.4 = 90,579.4, which reaches battle 5 (threshold 48,703.2) and not battle 6 (90,944.4), so its depth is 5 and the lane has 620 reachable points
- **AND** no member has a Rank step (each is at Gold1, the Epic cap)
- **AND** Tigurius's Ascension to Epic:RedThreeStars (power 20,569, effective 24,682.8) makes Four's effective power 92,993.8, which reaches battle 6 and not battle 7 (161,523.6), so Four's depth becomes 6 and battle 6 adds 43 + 43 + 30 + 75 = 191: gain +191
- **AND** Calgar's Ascension to Epic:RedTwoStars (power 24,155) makes Four's effective power 93,059.4, depth 6, gain +191. Titus's (24,419, for 93,115.4) and Incisus's (27,662, for 93,488.4) give the same
- **AND** the list shows four rows of +191, each "Four: battle 5 → 6", ordered Calgar, Incisus, Tigurius, Titus

#### Scenario: A stored depth moves by the estimate delta

- **GIVEN** the worked example where Four has a stored depth of 4 for the current run
- **WHEN** upgrade impact is computed
- **THEN** reachable points before are 0 + 75 + 175 + 183 = 433; Tigurius's step raises Four's estimate from 5 to 6, so its depth becomes 4 + 1 = 5, battle 5 adds 187, and the row reads "+187, Four: battle 4 → 5"

#### Scenario: A battle another team already reaches adds nothing

- **GIVEN** the worked example plus team **Melee** (Calgar, Titus, Incisus; covering Ultramarines and Melee; stored depth 6)
- **WHEN** upgrade impact is computed
- **THEN** Tigurius's step lifts Four to battle 6, which Melee already reaches with Ultramarines covered, so its gain is 0; Calgar's step leaves Melee's estimate at 5 (24,155 + 21,883 + 24,753 = 70,791 is below 90,944.4), so Melee's depth stays 6 and the gain is 0
- **AND** no row is listed

#### Scenario: Unlocking a member that does not reach a new battle

- **GIVEN** team **Five** = Calgar, Tigurius (Epic:RedOneStar, power 16,672, effective 20,006.4), Titus, Incisus and Certus, where Certus is not owned, so its effective power is 88,317.4 and its depth 5
- **WHEN** upgrade impact is computed
- **THEN** unlocking Certus adds his base power 45, for 88,362.4, still below battle 6's 90,944.4, so no Unlock row is listed

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

### Requirement: Upgrade impact is in the event page tour

The event page tour SHALL include an **Upgrade impact** step right after the Teams step, targeting the Alpha section's header (`data-testid="legendary-event-upgrade-impact"`) on both forms. The Teams step's copy SHALL mention Suggest teams, and the lane leaderboard step's copy SHALL mention Goals Preview and the row actions menu. Step titles and content SHALL be localized in en/de/es/fr.

#### Scenario: Tour on desktop

- **WHEN** the event page tour runs at or above 768px
- **THEN** after the Teams step, a step highlights Alpha's Upgrade impact header, and the following steps continue with the progress grid and the leaderboard

#### Scenario: Tour on mobile

- **WHEN** the event page tour runs below 768px
- **THEN** the same step follows the Teams step, with its target scrolled into view below the sticky lane strip
