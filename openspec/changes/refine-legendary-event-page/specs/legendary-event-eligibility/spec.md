# Spec Delta

## MODIFIED Requirements

### Requirement: Unit potential points and slots per lane

For an allowed unit on a lane, points per battle SHALL equal the lane's `killPoints` plus the `points` of every objective the unit satisfies; the **objectives count** SHALL equal the number of objectives it satisfies (the UI never says "slots"). A unit not allowed on the lane has 0 points and objectives count 0. Points compared across lanes are all "points per battle" and SHALL be labelled as such.

Assumptions:

- `killPoints` is awarded once per battle to any team that clears it, independent of objectives.
- An objective's `points` is per battle and constant across the lane's battles.

#### Scenario: Worked example on Lysander Alpha

- **GIVEN** Lysander Alpha has `killPoints 32` and objectives Eviscerate 75, Suppressive Fire 95, Flying 80, Min 5 hits 85, No Resilient 40, and `bloodDante` (Imperial, traits include Flying, no Resilient, melee Piercing 4 hits, ability damage Melta) is allowed
- **WHEN** potential is computed
- **THEN** Dante satisfies Flying and No Resilient only, so objectives count = 2 and points per battle = 32 + 80 + 40 = 152

#### Scenario: Not allowed unit

- **GIVEN** a Xenos character on Lysander Alpha
- **WHEN** potential is computed
- **THEN** points = 0, objectives count = 0 and the unit is absent from the leaderboard

### Requirement: Eligibility leaderboard section on the event page

Each lane tab SHALL render an Eligibility leaderboard section after the Synced progress grid, for that lane only. It SHALL list every allowed character with: portrait and localized name; owned state (present in the synced `characters` chunk) with the owned unit's rarity and rank, or a "locked" marker; one objective icon per lane objective in the lane's objective order, full-strength when satisfied and muted (reduced opacity, never colour alone) when not, each with accessible text; the unit's points figure (remaining points by default, see the Deduct scored points requirement); and the objectives count labelled "Objectives". Order SHALL be the points figure descending, then objectives count descending, then name ascending, with no user sort control. Filters: "Only unlocked" (default off) and the objective multi-select (see its requirement). Filter and toggle state are shared by the three lanes and the Overview leaderboard, persist while on the page and reset on leaving it. A lane with no allowed units SHALL show a "no eligible units" body. When the roster chunk is unavailable every unit SHALL render with unknown ownership (no locked marker, rarity or rank), an inline "roster not synced" note, and "Only unlocked" disabled.

#### Scenario: Default order

- **GIVEN** on an untouched Lysander Alpha, unit A has 152 points per battle and 2 objectives, unit B has 152 and 3, unit C has 207 and 2
- **WHEN** the leaderboard renders
- **THEN** the order is C (3,726 remaining), B (2,736), A (2,736), and there is no sort control

#### Scenario: Owned versus locked

- **GIVEN** the synced `characters` chunk contains `bloodDante` at rank Diamond1, progression Legendary 5 stars, and does not contain `astarLysander`
- **WHEN** the leaderboard renders
- **THEN** Dante's row shows Legendary rarity and the Diamond I rank badge, and Lysander's row shows the locked marker without rarity or rank

#### Scenario: Objective icons as indicators

- **GIVEN** Dante satisfies Flying and No Resilient on Lysander Alpha
- **WHEN** his row renders
- **THEN** the Flying and No Resilient icons render at full strength with "met" accessible text, and the Eviscerate, Suppressive Fire and Min 5 hits icons render muted with "not met" accessible text; no check or minus glyphs render

#### Scenario: Only unlocked

- **WHEN** the user enables "Only unlocked"
- **THEN** rows with the locked marker are removed from every lane and the Overview leaderboard, and the toggle stays on while switching tabs until the user leaves the page

#### Scenario: Roster unavailable

- **GIVEN** the `characters` chunk read failed
- **WHEN** the leaderboard renders
- **THEN** rows show no ownership, rarity or rank, the "roster not synced" note is shown and "Only unlocked" is disabled

#### Scenario: Desktop leaderboard

- **WHEN** the leaderboard renders at or above 768px
- **THEN** the lane is a table with columns unit, rarity, rank, one column per objective headed by its icon, points, Objectives; headers are not sortable; no horizontal page scroll

#### Scenario: Mobile leaderboard

- **WHEN** the leaderboard renders below 768px
- **THEN** each unit is a row card: portrait, name, rarity and rank badges, the row of objective icons, the points figure and "Objectives: N"; the filter and toggle controls sit in one compact bar above the list

#### Scenario: Tour step

- **WHEN** the event page tour runs on either form
- **THEN** a step highlights the Alpha leaderboard after the progress grid step, and an earlier step highlights the cross-lane leaderboard on Overview

## ADDED Requirements

### Requirement: Remaining points per unit on a lane

For an allowed unit on a lane, **remaining points** SHALL equal, summed over every battle of the lane, the scores of the objectives the unit satisfies that are not yet cleared in that battle according to the synced progress, where defeat-all counts as an objective the unit satisfies with score `killPoints`. Deduction is per objective per battle: a battle with some objectives cleared deducts only those. Without a synced entry for the event (or a null lane) nothing is cleared, so remaining points equal points per battle × the battle count. Remaining points are a client calculation and are never stored.

Assumptions:

- An objective cleared once in a battle cannot be scored again in that battle by any unit.
- The lane has the same objective scores in every battle (as the points-per-battle requirement assumes).

#### Scenario: Worked example, untouched lane

- **GIVEN** Dante has 152 points per battle on Lysander Alpha (32 defeat-all + 80 Flying + 40 No Resilient), 18 battles and no synced entry
- **WHEN** remaining points are computed
- **THEN** they are 152 × 18 = 2,736

#### Scenario: Worked example, five battles fully cleared

- **GIVEN** the same unit and battles 1–5 have every objective cleared
- **WHEN** remaining points are computed
- **THEN** they are 152 × 13 = 1,976

#### Scenario: Worked example, partially cleared battle

- **GIVEN** the same unit and only battle 1 has `objectivesCleared: [0, 3]` (defeat-all and Flying, catalog index 2)
- **WHEN** remaining points are computed
- **THEN** battle 1 contributes 40 (No Resilient only) and the lane total is 40 + 152 × 17 = 2,624

### Requirement: Deduct scored points toggle

The leaderboard controls SHALL include a **Deduct scored points** switch, on by default, shared by the three lanes and the Overview leaderboard. While on, every points figure on the leaderboards is the unit's remaining points, labelled "remaining"; while off, it is points per battle, labelled "per battle". The order follows the shown figure. The toggle persists while on the page and resets to on when leaving it.

#### Scenario: Default shows remaining points

- **WHEN** the leaderboard renders for a user who has cleared five Alpha battles fully
- **THEN** Dante's Alpha figure reads "1,976 remaining"

#### Scenario: Toggle off shows points per battle

- **WHEN** the user turns Deduct scored points off
- **THEN** Dante's Alpha figure reads "152 per battle" and the lists re-order by points per battle

#### Scenario: Progress unavailable

- **GIVEN** the `lre-progress` read rejected
- **WHEN** the toggle is on
- **THEN** figures are remaining points computed as if nothing were cleared, and the controls show an inline "synced progress unavailable" note

### Requirement: Objective multi-select filter

The leaderboard controls SHALL include an objective filter listing the current lane's objectives (icon and label) as multi-select chips; on the Overview leaderboard it lists the union of the three lanes' objectives. A unit stays listed only when it satisfies every selected objective (on Overview, on at least one lane for each selected objective). The selection is shared by the lane and Overview leaderboards, persists while on the page and resets on leaving it. A selection that matches no unit SHALL show a "no unit satisfies these objectives" body with a clear-filter action.

#### Scenario: Two objectives selected

- **GIVEN** Lysander Alpha and the user selects Flying and No Resilient
- **WHEN** the leaderboard renders
- **THEN** Dante is listed and a unit that satisfies only Flying is not

#### Scenario: Empty result

- **WHEN** the user selects Eviscerate and Min 5 hits and no allowed unit satisfies both
- **THEN** the body reads "no unit satisfies these objectives" with a clear action that empties the selection

### Requirement: Cross-lane eligibility leaderboard on Overview

The Overview tab SHALL render an Eligibility leaderboard with one row per character allowed on at least one lane, showing portrait, name, owned state with rarity and rank, and one points figure per lane (Alpha, Beta, Gamma; "—" when the lane does not allow the unit) following the Deduct scored points toggle. Rows are ordered by the sum of the three figures descending, then name. The row's accessible text names each lane's figure. Filters and toggles are the shared ones.

#### Scenario: Cross-lane row

- **GIVEN** Dante has 2,736 remaining on Alpha, 1,200 on Beta and is not allowed on Gamma
- **WHEN** Overview renders
- **THEN** his row shows 2,736, 1,200 and "—" under Alpha, Beta, Gamma, and he sorts by 3,936

#### Scenario: Desktop cross-lane leaderboard

- **WHEN** Overview renders at or above 768px
- **THEN** it is a table with unit, rarity, rank, Alpha, Beta, Gamma columns

#### Scenario: Mobile cross-lane leaderboard

- **WHEN** Overview renders below 768px
- **THEN** each unit is a row card with the three lane figures on one line beneath the name
