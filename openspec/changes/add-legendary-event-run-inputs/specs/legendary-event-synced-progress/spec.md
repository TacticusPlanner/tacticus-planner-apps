# Spec Delta

## ADDED Requirements

### Requirement: Uncleared objectives can be marked Maybe clear or Stop here

On the Synced progress grid, every cell the synced progress shows **not cleared** SHALL be a control that marks it **Maybe clear**, **Stop here** or **Not marked**, and each battle row that is not complete SHALL offer a row action that applies Maybe clear, Stop here or Clear marks to every not-cleared cell of that battle at once. A mark SHALL be stored on the plan as an annotation (`laneId`, 0-based `battleIndex`, `objectiveId` 0 for defeat-all and `index + 1` for an objective) through the plan's revision contract, shown at once and sent as one write per action through the shared plan write queue. A mark SHALL apply only while its cell is not cleared: a cell the synced progress shows cleared SHALL render as cleared with no mark and no control, whatever annotation is stored, and a complete battle SHALL have no row action. A marked cell SHALL show V1's icon for its status (a question mark in the warning colour for Maybe clear, a minus in the danger colour for Stop here) and expose "not cleared, marked Maybe clear" or "not cleared, marked Stop here" to assistive technology. Marks SHALL be reminders only: they never change earned points, maximum points, the lane summary or the reward projection. A short legend under the section header SHALL explain the two marks. On a 409 the queue SHALL adopt the returned plan with the existing "reloaded" toast; on another error the mark SHALL roll back with a translated error toast.

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

## MODIFIED Requirements

### Requirement: Synced progress grid section on the event page

Each lane tab SHALL render a Synced progress section after the Lane overview and before the Eligibility leaderboard, for that lane only. It SHALL show a header with points earned of maximum (for example "3,410 / 9,000") and a progress bar, then a grid of battles (rows, battle 1 first) by six columns: defeat-all and the five objectives in catalog order, each headed by its V1-set icon (defeat-all's own icon; objective icons per the objective-icons requirement) and labelled with its per-battle score. Each cell is a cleared or not-cleared indicator with accessible text, never colour alone; a not-cleared cell is also the control for its Maybe clear / Stop here mark (see "Uncleared objectives can be marked Maybe clear or Stop here"). Each row ends with the battle's earned points of its maximum and its high score when non-zero, and, when the battle is not complete, its row action. A collapsed "how points work" disclosure sits under the header and explains that earned points are the high score plus cleared objective scores; the marks legend sits beside it. Cleared state, scores and points SHALL be read-only; only marks are editable. The section heading SHALL carry a stable id so the Overview lane summary can scroll to it.

#### Scenario: Lane header totals

- **GIVEN** Lysander Alpha battles' earned points sum to 3,410
- **WHEN** the section renders
- **THEN** the Alpha header shows "3,410 / 9,000" and a bar at about 38%

#### Scenario: Desktop grid

- **WHEN** the section renders at or above 768px
- **THEN** the lane is a full grid with all 18 battle rows and six objective columns visible without horizontal page scroll; a not-cleared cell opens its mark menu as a popover, and each incomplete row ends with a "⋯" row action

#### Scenario: Mobile grid

- **WHEN** the section renders below 768px
- **THEN** each battle is a compact row with the battle number, six indicator cells and the earned points, and the column icons appear once in a header row directly under the sticky tab strip; tapping a not-cleared cell opens its mark menu, and the battle number of an incomplete row is the row action, with touch targets of at least 40px

#### Scenario: Accessible cleared state

- **WHEN** a cell renders
- **THEN** it exposes "cleared" or "not cleared" text to assistive technology in addition to its icon, followed by its mark when it has one, and a not-cleared cell is reachable and operable by keyboard

#### Scenario: Tour step

- **WHEN** the event page tour runs on either form
- **THEN** a step highlights the Alpha progress grid after the lane overview step and before the leaderboard step, and its copy mentions that not-cleared cells can be marked Maybe clear or Stop here
