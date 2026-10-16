# Spec Delta

## MODIFIED Requirements

### Requirement: Run history figures are derived from the record

For a record and a lane, the system SHALL derive: the **lane cleared battle**, the highest 1-based battle whose encounter has defeat-all (id 0) in `objectivesCleared`, or 0; the **lane points**, the sum over its encounters of the high score counted twice (the record stores only the high score, which the game reports equal to the kill score, so it stands for both awards), plus the battle's defeat-all score when id 0 is cleared, plus the catalog score of each cleared bonus objective (the synced-progress earned-points rule, with the current catalog lane); and, for each team in the record's teams snapshot on that lane, the **team cleared battle**, the highest battle whose encounter clears defeat-all and every objective id `index + 1` of the team's snapshot `objectiveIndexes` (a team with no objectives uses the lane cleared battle). The team figure is inferred from shared lane progress and SHALL be labelled "cleared up to". A lane whose stored encounter count exceeds the current catalog lane's battle count SHALL show its cleared battle but no points.

Assumptions:

- Objective id 0 is defeat-all and id k is the objective with catalog index k − 1 (synced-progress contract).
- The game does not report which team cleared which objective, so a team's figure is the deepest battle where everything it covers was cleared by anyone.
- A record keeps no separate kill score; the kill score is taken as the stored high score, as in every synced encounter observed.

#### Scenario: Worked example, Uthar Alpha run 1

- **GIVEN** a run 1 record whose Alpha encounters are battle 1 `[0,1,2,3,4,5]` high score 29, battle 2 `[0,1,4,5]` high score 31, battle 3 `[0,4]` high score 35, battle 4 `[0,1]` high score 30, battle 5 `[]` high score 12
- **AND** Uthar Alpha's defeat-all is 30 per battle and its objectives are Ultramarines 75 (index 0), Resilient 95 (1), Max 2 Hits 50 (2), Melee 65 (3), Piercing 90 (4)
- **WHEN** the lane figures are derived
- **THEN** the lane cleared battle is 4
- **AND** the lane points are battle 1: 29 + 29 + 30 + 375 = 463; battle 2: 31 + 31 + 30 + 75 + 65 + 90 = 322; battle 3: 35 + 35 + 30 + 65 = 165; battle 4: 30 + 30 + 30 + 75 = 165; battle 5: 12 + 12 = 24; total 1,139

#### Scenario: Worked example, team cleared battles

- **GIVEN** the same record's teams snapshot holds Alpha teams "Ultras" (objectives `[0,3]`, ids 1 and 4) and "Melee" (objectives `[3]`, id 4)
- **WHEN** the team figures are derived
- **THEN** Ultras cleared up to battle 2 (battle 3 lacks id 1) and Melee cleared up to battle 3 (battle 4 lacks id 4)

### Requirement: Last run card on the Overview tab

The Overview tab SHALL show a **Last run** card for the previous run when one exists, after the Run status card. It SHALL show "Run N of 3", the local date of the record's last progress, the event points recorded, and per lane its cleared battle and points ("Alpha: battle 4 · 1,139 points"); the teams used per lane with portraits and "cleared up to battle N" (and their planned depth for that run when stored); and a **Since last run** list of roster changes. On an archived or upcoming event the card SHALL be followed by a collapsed **Earlier runs** list with one expandable entry per earlier record carrying the same content; an active event SHALL show only the Last run card.

#### Scenario: Desktop card

- **WHEN** the Overview renders at or above 768px with a previous run
- **THEN** the card shows the three lanes side by side, each with its cleared battle, points and teams, and the Since last run list below them

#### Scenario: Mobile card

- **WHEN** the Overview renders below 768px with a previous run
- **THEN** the card stacks the lanes, each lane's teams collapse behind a "Teams (N)" toggle, and the Since last run list follows; nothing scrolls horizontally

#### Scenario: Teams with a planned depth

- **GIVEN** the record's "Ultras" team has `expectedBattleClears` 6 for that run
- **WHEN** the card renders
- **THEN** the team row reads "cleared up to battle 2 · planned 6"
