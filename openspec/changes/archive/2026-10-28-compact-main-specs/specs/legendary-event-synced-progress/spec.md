## MODIFIED Requirements

### Requirement: Uncleared objectives can be marked Maybe clear or Stop here

On the Synced progress grid, every cell the synced progress shows **not cleared** SHALL be a control that marks it **Maybe clear**, **Stop here** or **Not marked**, and each battle row that is not complete SHALL offer a row action that applies Maybe clear, Stop here or Clear marks to every not-cleared cell of that battle at once. A mark SHALL be stored on the plan as an annotation (`laneId`, 0-based `battleIndex`, `objectiveId` 0 for defeat-all and `index + 1` for an objective) through the plan's revision contract, shown at once and sent as one write per action through the shared plan write queue. A mark SHALL apply only while its cell is not cleared: a cell the synced progress shows cleared SHALL render as cleared with no mark and no control, whatever annotation is stored, and a complete battle SHALL have no row action. A marked cell SHALL show V1's icon for its status (a question mark in the warning colour for Maybe clear, a minus in the danger colour for Stop here) and expose "not cleared, marked Maybe clear" or "not cleared, marked Stop here" to assistive technology. Marks SHALL never change earned points, maximum points, the lane summary or the reward projection. They SHALL steer the token plan as `legendary-event-token-plan` specifies. Marks can also be set from the Next token card's actions, through the same annotation write. A short legend under the section header SHALL explain the two marks. Conflicts and failures follow the plan write queue (`legendary-event-teams`).

Assumptions:

- A lane's battle progress carries over between runs, so marks are per plan, not per run.
- A cell, once cleared by sync, does not become not cleared again.

#### Scenario: Mark one cell

- **GIVEN** Lysander Alpha battle 7 has defeat-all cleared and Flying (objective index 2) not cleared, and no marks
- **WHEN** the user opens the Flying cell of battle 7 and chooses Stop here
- **THEN** the cell shows the Stop here icon at once and one write sends `laneId` `alpha`, `battleIndex` 6, `objectiveIds` `[3]`, `status` `stopHere`

#### Scenario: Mark a whole battle

- **GIVEN** Lysander Alpha battle 9 has Suppressive Fire cleared and the other five cells not cleared
- **WHEN** the user opens battle 9's row action and chooses Maybe clear
- **THEN** the five not-cleared cells show the Maybe clear icon and one write sends `battleIndex` 8, `objectiveIds` `[0, 1, 3, 4, 5]`, `status` `maybeClear`; the Suppressive Fire cell stays cleared

#### Scenario: Sync clears a marked cell

- **GIVEN** battle 7's Flying cell is marked Stop here
- **WHEN** a sync reports Flying cleared in battle 7
- **THEN** the cell renders cleared with no mark and no control, and nothing is written

#### Scenario: Complete battle has no marks

- **GIVEN** battle 4 is complete and the plan holds a Maybe clear annotation on its defeat-all cell from before it was cleared
- **WHEN** the grid renders
- **THEN** battle 4 shows six cleared cells, no mark and no row action

#### Scenario: Marks do not change points

- **GIVEN** battle 9 is marked Maybe clear
- **WHEN** the lane header, the row's earned points and the Overview lane summary render
- **THEN** each figure equals the figure without the mark
