# Spec Delta

## MODIFIED Requirements

### Requirement: Eligibility leaderboard section on the event page

Each lane tab SHALL render an Eligibility leaderboard section after the Synced progress grid, for that lane only. It SHALL list every allowed character with: portrait and localized name; a **trait marker** (the trait's icon with the localized trait name as accessible text) after the name for each of Healer and Mechanic the unit's catalog traits include; owned state (present in the synced `characters` chunk) with the owned unit's rarity and rank, or a "locked" marker; one objective icon per lane objective in the lane's objective order, full-strength when satisfied and muted (reduced opacity, never colour alone) when not, each with accessible text; the unit's points figure (remaining points by default, see the Deduct scored points requirement); and the objectives count labelled "Objectives". Order SHALL be the points figure descending, then objectives count descending, then name ascending, with no user sort control. Filters: "Only unlocked" (default off) and the objective multi-select (see its requirement). Filter and toggle state are shared by the three lanes and the Overview leaderboard, persist while on the page and reset on leaving it. A lane with no allowed units SHALL show a "no eligible units" body. When the roster chunk is unavailable every unit SHALL render with unknown ownership (no locked marker, rarity or rank), an inline "roster not synced" note, and "Only unlocked" disabled.

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

#### Scenario: Trait markers

- **GIVEN** a listed unit whose catalog traits include Healer, and Dante whose traits include neither Healer nor Mechanic
- **WHEN** their rows render on a lane or Overview leaderboard
- **THEN** the Healer icon follows the first unit's name with the accessible text "Healer", and no trait marker follows Dante's name

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

### Requirement: Objective multi-select filter

The leaderboard controls SHALL include an objective filter listing the current lane's objectives (icon and label) as multi-select chips in the lane's objective order; on the Overview leaderboard the chips SHALL be grouped per lane under Alpha, Beta and Gamma headings in that order, each group listing that lane's objectives, so an objective shared by two lanes appears in each lane's group. When synced progress is available every chip's label SHALL be followed by "cleared / battles" for that lane's objective (the number of the lane's battles whose synced progress has the objective cleared, of the lane's battle count; 0 for a lane with no synced record); when the progress read failed the chips carry no count. A chip's selection is the objective's filter identity, so selecting a shared objective in one group selects it in every group. A unit stays listed only when it satisfies every selected objective (on Overview, on at least one lane for each selected objective). The selection is shared by the lane and Overview leaderboards, persists while on the page and resets on leaving it. A selection that matches no unit SHALL show a "no unit satisfies these objectives" body with a clear-filter action.

#### Scenario: Two objectives selected

- **GIVEN** Lysander Alpha and the user selects Flying and No Resilient
- **WHEN** the leaderboard renders
- **THEN** Dante is listed and a unit that satisfies only Flying is not

#### Scenario: Empty result

- **WHEN** the user selects Eviscerate and Min 5 hits and no allowed unit satisfies both
- **THEN** the body reads "no unit satisfies these objectives" with a clear action that empties the selection

#### Scenario: Grouped Overview chips with counts

- **GIVEN** Lysander on Overview with synced progress where Alpha clears Flying in 11 of 18 battles and Beta clears Flying in 3 of 18
- **WHEN** the controls render
- **THEN** the chips sit under Alpha, Beta and Gamma headings; the Alpha Flying chip reads "Flying 11 / 18" and the Beta Flying chip "Flying 3 / 18"; selecting either marks both pressed and keeps only units satisfying Flying

#### Scenario: Lane tab chips

- **GIVEN** the Alpha tab with synced progress
- **WHEN** the controls render
- **THEN** the chips are one unlabeled row of Alpha's five objectives, each with its "cleared / 18" count

#### Scenario: Progress unavailable

- **GIVEN** the `lre-progress` read rejected
- **WHEN** the controls render
- **THEN** the chips show labels without counts and the "synced progress unavailable" note is shown

### Requirement: Cross-lane eligibility leaderboard on Overview

The Overview tab SHALL render an Eligibility leaderboard with one row per character allowed on at least one lane, showing portrait, name, trait markers, owned state with rarity and rank, and one cell per lane (Alpha, Beta, Gamma) carrying the lane's objective icons as met / muted indicators in the lane's objective order, each with accessible text, above the lane's points figure following the Deduct scored points toggle; a lane that does not allow the unit shows "—" and no indicators. Rows are ordered by the sum of the three figures descending, then name. The row's accessible text names each lane's figure. Filters and toggles are the shared ones.

#### Scenario: Cross-lane row

- **GIVEN** Dante has 2,736 remaining on Alpha, 1,200 on Beta and is not allowed on Gamma
- **WHEN** Overview renders
- **THEN** his row shows 2,736, 1,200 and "—" under Alpha, Beta, Gamma, and he sorts by 3,936

#### Scenario: Cross-lane objective indicators

- **GIVEN** Dante satisfies Flying and No Resilient on Alpha, Flying on Beta, and is not allowed on Gamma
- **WHEN** Overview renders
- **THEN** his Alpha cell shows Flying and No Resilient at full strength and Alpha's other objectives muted, his Beta cell shows Flying at full strength and Beta's others muted, and his Gamma cell shows "—" with no indicators

#### Scenario: Desktop cross-lane leaderboard

- **WHEN** Overview renders at or above 768px
- **THEN** it is a table with unit, rarity, rank, Alpha, Beta, Gamma columns, each lane cell stacking the indicators over the figure

#### Scenario: Mobile cross-lane leaderboard

- **WHEN** Overview renders below 768px
- **THEN** each unit is a row card with one line per lane beneath the name: the lane label, its indicators and its figure
