# Spec Delta

## MODIFIED Requirements

### Requirement: Synced lane data maps onto battles and objectives

The synced `lre-progress` entry for the event SHALL be read per lane from its `alpha` / `beta` / `gamma` record. `encounters[i]` SHALL be battle `i`. In `objectivesCleared`, index 0 SHALL mean the defeat-all objective and index `k` in 1..5 SHALL mean the objective whose catalog `index` is `k − 1`. A battle's **earned points** SHALL be its `highScore`, plus the battle's `defeatAll` score when id 0 is in `objectivesCleared`, plus the catalog `points` of every bonus objective whose id is in `objectivesCleared`; the synced `encounterPoints` SHALL NOT be displayed or summed. A battle with no encounter entry has nothing cleared and 0 points. A null lane SHALL present as "no progress in this lane". Points earned per lane SHALL be Σ battle earned points; per event Σ over lanes. A battle is "complete" when `objectivesCleared` contains every expected id from 0 through 5; ids outside 0..5 SHALL be ignored.

Assumptions:

- The game's objective order per battle is defeat-all first, then the five objectives in the catalog's `unitsRestrictions.index` order.
- `highScore` is the kill score the player actually achieved in the battle (at most `battlesPoints[i]`) and is the only variable score; on the account checked on 2026-10-07 `encounterPoints` equalled `highScore` and omitted the cleared defeat-all and objective scores, which is why it is not used.
- Whether the second `battlesPoints[i]` of the maximum model ("high score" beside "kill score") is a separate award is unverified; until the lane total is checked against the in-game lane screen, earned points may read below the maximum for a fully cleared battle.
- Lane ids 1, 2, 3 are Alpha, Beta, Gamma, already mapped server-side.

#### Scenario: Partially cleared battle

- **GIVEN** Lysander Alpha `encounters[0] = { objectivesCleared: [0, 2, 3], highScore: 31, encounterPoints: 31 }`, `defeatAll[0] = 32`, and objective scores Eviscerate 75 (index 0), Suppressive Fire 95 (index 1), Flying 80 (index 2), Min 5 hits 85, No Resilient 40
- **WHEN** the grid row for battle 1 renders
- **THEN** defeat-all, Suppressive Fire and Flying are marked cleared; the row shows 31 + 32 + 95 + 80 = 238 of 471 points and high score 31; the battle is not complete

#### Scenario: Complete battle

- **GIVEN** `encounters[3] = { objectivesCleared: [0, 1, 2, 3, 4, 5], highScore: 37 }` on the same lane
- **WHEN** the row for battle 4 renders
- **THEN** all six cells are cleared, the row is marked complete and shows 37 + 32 + 375 = 444 points

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

### Requirement: Synced progress grid section on the event page

Each lane tab SHALL render a Synced progress section after the Lane overview and before the Eligibility leaderboard, for that lane only. It SHALL show a header with points earned of maximum (for example "3,410 / 9,000") and a progress bar, then a grid of battles (rows, battle 1 first) by six columns: defeat-all and the five objectives in catalog order, each headed by its V1-set icon (defeat-all's own icon; objective icons per the objective-icons requirement) and labelled with its per-battle score. Each cell is a cleared or not-cleared indicator with accessible text, never colour alone. Each row ends with the battle's earned points of its maximum and its high score when non-zero. A collapsed "how points work" disclosure sits under the header and explains that earned points are the high score plus cleared objective scores. The grid SHALL be read-only. The section heading SHALL carry a stable id so the Overview lane summary can scroll to it.

#### Scenario: Lane header totals

- **GIVEN** Lysander Alpha battles' earned points sum to 3,410
- **WHEN** the section renders
- **THEN** the Alpha header shows "3,410 / 9,000" and a bar at about 38%

#### Scenario: Desktop grid

- **WHEN** the section renders at or above 768px
- **THEN** the lane is a full grid with all 18 battle rows and six objective columns visible without horizontal page scroll

#### Scenario: Mobile grid

- **WHEN** the section renders below 768px
- **THEN** each battle is a compact row with the battle number, six indicator cells and the earned points, and the column icons appear once in a header row directly under the sticky tab strip

#### Scenario: Accessible cleared state

- **WHEN** a cell renders
- **THEN** it exposes "cleared" or "not cleared" text to assistive technology in addition to its icon

#### Scenario: Tour step

- **WHEN** the event page tour runs on either form
- **THEN** a step highlights the Alpha progress grid after the lane overview step and before the leaderboard step

## ADDED Requirements

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
