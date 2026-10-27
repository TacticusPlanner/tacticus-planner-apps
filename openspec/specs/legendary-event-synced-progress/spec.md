# legendary-event-synced-progress Specification

## Purpose

How a player's synced Tacticus Legendary Event progress maps onto a lane's battles and objectives, how points earned and maximum points are computed per battle and per lane, and how the synced progress grid presents them on the event page, on desktop and mobile.

## Requirements

### Requirement: Canonical lane points model

For each lane the system SHALL build one points model from the catalog: per battle `i` (0-based, in `battleIds` order) `battlePoints = battlesPoints[i]`, `defeatAllPoints = defeatAll[i]`, and the five objective scores. Per-battle maximum SHALL be `battlePoints` (kill score) + `battlePoints` (high score) + `defeatAllPoints` + Σ objective scores. Lane maximum SHALL be the sum over battles. Every summary (lane, event, hub, Home) SHALL derive from this one model.

Assumptions:

- Kill score and high score each award up to `battlesPoints[i]` for battle `i`.
- Defeat-all awards `defeatAll[i]` once per battle.
- Each objective awards its fixed `score` once per battle.

#### Scenario: Worked example, Lysander Alpha battle 1

- **GIVEN** `battlesPoints[0] = 32`, `defeatAll[0] = 32`, objective scores 75, 95, 80, 85, 40
- **WHEN** the battle maximum is computed
- **THEN** it is 32 + 32 + 32 + 375 = 471

#### Scenario: Worked example, Lysander Alpha lane maximum

- **GIVEN** `battlesPoints` sums to 829 over 18 battles, `defeatAll` is 32 for battles 1–17 and 48 for battle 18, and objective scores sum to 375
- **WHEN** the lane maximum is computed
- **THEN** it is 829 × 2 + (17 × 32 + 48) + 18 × 375 = 1,658 + 592 + 6,750 = 9,000

### Requirement: Synced lane data maps onto battles and objectives

The synced `lre-progress` entry for the event SHALL be read per lane from its `alpha` / `beta` / `gamma` record. `encounters[i]` SHALL be battle `i`. In `objectivesCleared`, index 0 SHALL mean the defeat-all objective and index `k` in 1..5 SHALL mean the objective whose catalog `index` is `k − 1`. A battle's **kill score** SHALL be its synced `encounterPoints` and its **high score** its synced `highScore`, each capped at `battlesPoints[i]` and 0 without an encounter. A battle's **earned points** SHALL be its kill score, plus its high score, plus the battle's `defeatAll` score when id 0 is in `objectivesCleared`, plus the catalog `points` of every bonus objective whose id is in `objectivesCleared`. A battle with no encounter entry has nothing cleared and 0 points. A null lane SHALL present as "no progress in this lane". Points earned per lane SHALL be Σ battle earned points; per event Σ over lanes. A battle is "complete" when `objectivesCleared` contains every expected id from 0 through 5; ids outside 0..5 SHALL be ignored.

Assumptions:

- The game's objective order per battle is defeat-all first, then the five objectives in the catalog's `unitsRestrictions.index` order.
- `encounterPoints` is the battle's kill score and `highScore` its high score, each at most `battlesPoints[i]`; neither includes the defeat-all or objective scores. On all 121 synced encounters of the three events checked on 2026-10-16 the two were equal, and the owner confirms the V1 lane totals, which count both, match the game; so the game awards both and a fully cleared battle at full scores reaches its maximum.
- A lane's earned points computed this way sum, over the three lanes, to the synced `currentPoints` of the entry (`votanUthar`: 4,137 + 4,709 + 4,293 = 13,139).
- Lane ids 1, 2, 3 are Alpha, Beta, Gamma, already mapped server-side.

#### Scenario: Partially cleared battle

- **GIVEN** Lysander Alpha `encounters[0] = { objectivesCleared: [0, 2, 3], highScore: 31, encounterPoints: 31 }`, `defeatAll[0] = 32`, and objective scores Eviscerate 75 (index 0), Suppressive Fire 95 (index 1), Flying 80 (index 2), Min 5 hits 85, No Resilient 40
- **WHEN** the grid row for battle 1 renders
- **THEN** defeat-all, Suppressive Fire and Flying are marked cleared; the row shows 31 + 31 + 32 + 95 + 80 = 269 of 471 points and high score 31; the battle is not complete

#### Scenario: Complete battle

- **GIVEN** `encounters[3] = { objectivesCleared: [0, 1, 2, 3, 4, 5], highScore: 37, encounterPoints: 37 }` on the same lane
- **WHEN** the row for battle 4 renders
- **THEN** all six cells are cleared, the row is marked complete and shows 37 + 37 + 32 + 375 = 481 points, its maximum

#### Scenario: Battles beyond the synced encounters

- **GIVEN** a lane with 7 encounter entries on an 18-battle lane
- **WHEN** the grid renders
- **THEN** battles 8–18 show every cell not cleared and 0 points, and the lane header reads the sum of the seven battles' earned points

#### Scenario: Null lane

- **GIVEN** the event's synced entry has `gamma: null`
- **WHEN** the Gamma grid renders
- **THEN** it shows the "no progress in this lane" body and the lane header shows 0 of the lane maximum

#### Scenario: Event absent from the chunk

- **GIVEN** the synced `lre-progress` array has no entry for the event
- **WHEN** the progress section renders
- **THEN** every lane shows the "no synced progress for this event yet" body with its maximum, and the lane headers still render

#### Scenario: Worked example, Uthar Alpha battle 1

- **GIVEN** `votanUthar` Alpha battle 1 (`battlesPoints` 29, `defeatAll` 30, objectives Ultramarines 75, Resilient 95, Max 2 Hits 50, Melee 65, Piercing 90) with `encounters[0] = { objectivesCleared: [0, 2, 3, 4], highScore: 29, encounterPoints: 29 }`
- **WHEN** the grid row for battle 1 renders
- **THEN** it shows 29 + 29 + 30 + 95 + 50 + 65 = 298 of 463 points and high score 29

#### Scenario: Lane totals equal the synced run points

- **GIVEN** `votanUthar`'s synced lanes whose kill scores and high scores each sum to 506 (Alpha), 551 (Beta) and 441 (Gamma), and whose cleared defeat-all and objective scores sum to 3,125, 3,607 and 3,411
- **WHEN** the lane headers render
- **THEN** they read 506 + 506 + 3,125 = 4,137, 551 + 551 + 3,607 = 4,709 and 441 + 441 + 3,411 = 4,293, which sum to the synced `currentPoints` 13,139

### Requirement: Synced progress grid section on the event page

Each lane tab SHALL render a Synced progress section after the Lane overview and before the Eligibility leaderboard, for that lane only. It SHALL show a header with points earned of maximum (for example "3,410 / 9,000") and a progress bar, then a grid of battles (rows, battle 1 first) by six columns: defeat-all and the five objectives in catalog order, each headed by its V1-set icon (defeat-all's own icon; objective icons per the objective-icons requirement) and labelled with its per-battle score. Each cell is a cleared or not-cleared indicator with accessible text, never colour alone; a not-cleared cell is also the control for its Maybe clear / Stop here mark (see "Uncleared objectives can be marked Maybe clear or Stop here"). Each row ends with the battle's earned points of its maximum and its high score when non-zero, and, when the battle is not complete, its row action. A collapsed "how points work" disclosure sits under the header and explains that earned points are the kill score plus the high score plus the defeat-all and cleared objective scores; the marks legend sits beside it. Cleared state, scores and points SHALL be read-only; only marks are editable. The section heading SHALL carry a stable id so the Overview lane summary can scroll to it.

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

### Requirement: Objective icons use the V1 icon set

Every objective icon on the event page (lane overview chips, grid header, leaderboard indicators, objective filter) SHALL render as V1 did: a trait, damage-type or faction game icon for those kinds; the game's hit stat icon with a "≥" badge for `MinHits` and "≤" for `MaxHits`; the game's ranged-attack stat icon for `AttackType` Ranged and the melee-attack stat icon for its `exclude` form (Melee); and, for any other `exclude: true` filter, the base icon with a small red X badge at its bottom-right. The defeat-all column SHALL use V1's defeat-all icon. Icons are decorative: the label or accessible text beside them carries the meaning.

#### Scenario: Negated trait

- **WHEN** the `No Resilient` objective icon renders
- **THEN** the Resilient trait icon shows with a red X badge

#### Scenario: Hits objective

- **WHEN** the `Min 5 hits` objective icon renders
- **THEN** the hit stat icon shows with a "≥" badge, and `Max 2 hits` shows it with "≤"

#### Scenario: Attack type

- **WHEN** a `{ kind: "AttackType", target: "Ranged", exclude: true }` objective icon renders
- **THEN** the melee-attack stat icon shows without a badge

### Requirement: Uncleared objectives can be marked Maybe clear or Stop here

On the Synced progress grid, every cell the synced progress shows **not cleared** SHALL be a control that marks it **Maybe clear**, **Stop here** or **Not marked**, and each battle row that is not complete SHALL offer a row action that applies Maybe clear, Stop here or Clear marks to every not-cleared cell of that battle at once. A mark SHALL be stored on the plan as an annotation (`laneId`, 0-based `battleIndex`, `objectiveId` 0 for defeat-all and `index + 1` for an objective) through the plan's revision contract, shown at once and sent as one write per action through the shared plan write queue. A mark SHALL apply only while its cell is not cleared: a cell the synced progress shows cleared SHALL render as cleared with no mark and no control, whatever annotation is stored, and a complete battle SHALL have no row action. A marked cell SHALL show V1's icon for its status (a question mark in the warning colour for Maybe clear, a minus in the danger colour for Stop here) and expose "not cleared, marked Maybe clear" or "not cleared, marked Stop here" to assistive technology. Marks SHALL never change earned points, maximum points, the lane summary or the reward projection. They SHALL steer the token plan (see `legendary-event-token-plan`): a Stop here cell is never planned and a Stop here defeat-all stops planning on that lane at that battle; a token that clears a Maybe clear cell is planned but flagged. Marks can also be set from the Next token card's actions, through the same annotation write. A short legend under the section header SHALL explain the two marks. On a 409 the queue SHALL adopt the returned plan with the existing "reloaded" toast; on another error the mark SHALL roll back with a translated error toast.

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
