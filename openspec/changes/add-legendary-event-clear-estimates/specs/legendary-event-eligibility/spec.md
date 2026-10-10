# Spec Delta

## MODIFIED Requirements

### Requirement: Eligibility leaderboard section on the event page

Each lane tab SHALL render an Eligibility leaderboard section after the Synced progress grid, for that lane only. It SHALL list every allowed character with: portrait and localized name; a **trait marker** (the trait's icon with the localized trait name as accessible text) after the name for each of Healer and Mechanic the unit's catalog traits include; owned state (present in the synced `characters` chunk) with the owned unit's rarity and rank, or a "locked" marker; one objective icon per lane objective in the lane's objective order, full-strength when satisfied and muted (reduced opacity, never colour alone) when not, each with accessible text; the unit's points figure (remaining points by default, see the Deduct scored points requirement); the objectives count labelled "Objectives"; and the unit's estimated clears on this lane labelled "Clears" (see `legendary-event-clear-estimates`: "~n" for an owned unit, "—" for a locked unit or unknown ownership, a placeholder dash while loading, and absent when the clear-estimate dataset is unavailable). Order SHALL be the points figure descending, then objectives count descending, then name ascending, with no user sort control; estimated clears do not affect order. Filters: "Only unlocked" (default off) and the objective multi-select (see its requirement). Filter and toggle state are shared by the three lanes and the Overview leaderboard, persist while on the page and reset on leaving it. The Overview leaderboard does not show estimated clears. A lane with no allowed units SHALL show a "no eligible units" body. When the roster chunk is unavailable every unit SHALL render with unknown ownership (no locked marker, rarity, rank or estimate), an inline "roster not synced" note, and "Only unlocked" disabled.

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

#### Scenario: Estimated clears on a row

- **GIVEN** `ultraTigurius` owned with an estimated 6 clears on Uthar Alpha and `ultraCalgar` not owned
- **WHEN** the Alpha leaderboard renders
- **THEN** Tigurius's row shows "Clears ~6" and Calgar's row shows "Clears —"

#### Scenario: Only unlocked

- **WHEN** the user enables "Only unlocked"
- **THEN** rows with the locked marker are removed from every lane and the Overview leaderboard, and the toggle stays on while switching tabs until the user leaves the page

#### Scenario: Roster unavailable

- **GIVEN** the `characters` chunk read failed
- **WHEN** the leaderboard renders
- **THEN** rows show no ownership, rarity, rank or estimate, the "roster not synced" note is shown and "Only unlocked" is disabled

#### Scenario: Desktop leaderboard

- **WHEN** the leaderboard renders at or above 768px
- **THEN** the lane is a table with columns unit, rarity, rank, one column per objective headed by its icon, points, Objectives, Clears; headers are not sortable; no horizontal page scroll

#### Scenario: Mobile leaderboard

- **WHEN** the leaderboard renders below 768px
- **THEN** each unit is a row card: portrait, name, rarity and rank badges, the row of objective icons, the points figure and "Objectives: N · Clears: ~n"; the filter and toggle controls sit in one compact bar above the list

#### Scenario: Tour step

- **WHEN** the event page tour runs on either form
- **THEN** a step highlights the Alpha leaderboard after the progress grid step, and an earlier step highlights the cross-lane leaderboard on Overview
