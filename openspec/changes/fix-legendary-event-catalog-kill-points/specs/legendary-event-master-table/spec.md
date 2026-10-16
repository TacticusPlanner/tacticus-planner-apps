# Spec Delta

## MODIFIED Requirements

### Requirement: The master table ranks units across selected events

`/legendary-events/master-table` SHALL show one row per unit that at least one lane of a selected event allows, with one cell per selected event and a total. A cell SHALL show the unit's points for that event in the current points mode and, in the All and Unlocked unit sets, its objectives count (the sum over the event's lanes of the objectives the unit satisfies); in the In teams unit set it SHALL show the number of distinct teams of the event's plan holding the unit (as member or reserve) and those teams' lanes. A lane that does not allow the unit SHALL contribute nothing. The row total SHALL be the sum of its cells. Rows SHALL be ordered by the sort key descending (the total by default, or one selected event's points), then by total, then by localized unit name. All figures SHALL be in event points and anchored to the unit's current synced progression.

Assumptions:

- A lane's points per battle for a unit are the lane's kill points (defeat-all) plus the scores of the bonus objectives the unit satisfies, each awarded once per battle (Stage 1 rule).
- Every lane has the catalog battle count (18 for every served event today).
- Objective matching reads only static unit data, so a unit's satisfied objectives do not depend on its rank or stars.

#### Scenario: Worked example, All mode, Dante across Lysander and Uthar

- **GIVEN** events Lysander and Uthar are selected, points mode All, unit set All, and `bloodDante` (Imperial; traits Flying, Rapid Assault, no Resilient; melee Piercing 4 hits; active ability damage Melta; no ranged attack)
- **AND** Lysander Alpha (kill points 32; Eviscerate 75, Suppressive Fire 95, Flying 80, Min 5 Hits 85, No Resilient 40), Lysander Beta (No Imperials), Lysander Gamma (kill points 31; No Bolter 40, Healer 100, Min 3 Hits 60, Plasma 95, Rapid Assault 80)
- **AND** Uthar Alpha (kill points 30; Ultramarines 75, Resilient 95, Max 2 Hits 50, Melee 65, Piercing 90), Uthar Beta (No Imperials), Uthar Gamma (kill points 43; No Power 50, Bolter 85, Mechanical 100, Max 1 Hit 75, Big Target 65), 18 battles per lane
- **WHEN** the table renders
- **THEN** Lysander: Alpha 32 + 80 + 40 = 152 per battle × 18 = 2,736 (2 objectives); Beta 0; Gamma 31 + 40 + 60 + 80 = 211 × 18 = 3,798 (3 objectives); cell 6,534 points, 5 objectives
- **AND** Uthar: Alpha 30 + 65 + 90 = 185 × 18 = 3,330 (2 objectives); Beta 0; Gamma 43 + 50 = 93 × 18 = 1,674 (1 objective); cell 5,004 points, 3 objectives
- **AND** Dante's total is 6,534 + 5,004 = 11,538

#### Scenario: Sort by one event

- **GIVEN** the same table and the user sorts by Uthar
- **WHEN** the rows reorder
- **THEN** they are ordered by the Uthar cell's points descending, ties broken by total then name, and the sort is reflected in the URL as `sort=votanUthar`

### Requirement: Points modes

The page SHALL offer three points modes, shared by every cell: **Remaining** (default), **All** and **Estimated**, each with a one-line explanation in a "How points work" disclosure.

- **All**: per lane, points per battle × battle count.
- **Remaining**: per lane, for every battle, the defeat-all points unless synced objective id 0 is cleared in that battle, plus each considered objective's score unless that objective is cleared in that battle (the Stage 1 remaining-points rule). Without a synced entry for the event nothing is cleared, so Remaining equals All.
- **Estimated**: Remaining restricted to battles 1..d of each lane, where d is, in the In teams unit set, the deepest effective depth (the current run's stored depth, else the team estimate) among the unit's teams on that lane, and otherwise the unit's Stage 5 per-unit clear estimate on that lane. A lane with no depth (unit not owned, or no estimate) SHALL contribute 0.

Assumptions:

- Synced `objectivesCleared` is the source of what is cleared; id 0 is defeat-all and id k is the objective with catalog index k − 1.
- The per-unit clear estimate is a team of five like the unit, scaled by its horde-mode tier and the calibrated power ratio (Stage 5), anchored to current progression.

#### Scenario: Worked example, Remaining

- **GIVEN** the Dante example, Remaining mode, and synced Lysander Alpha battles 1–5 with every objective cleared and nothing cleared elsewhere
- **WHEN** the table renders
- **THEN** Lysander Alpha is 152 × 13 = 1,976, Lysander's cell is 1,976 + 3,798 = 5,774, Uthar's is 5,004, and the total is 10,778

#### Scenario: Worked example, Estimated

- **GIVEN** the same progress and Dante's Stage 5 estimates of 7 battles on Lysander Alpha, 4 on Lysander Gamma, 6 on Uthar Alpha and 9 on Uthar Gamma
- **WHEN** Estimated is chosen
- **THEN** Lysander Alpha counts battles 6–7 only, 152 × 2 = 304; Lysander Gamma 211 × 4 = 844; Lysander's cell is 1,148
- **AND** Uthar Alpha is 185 × 6 = 1,110, Uthar Gamma 93 × 9 = 837, Uthar's cell 1,947, and the total 3,095

#### Scenario: Estimated for a locked unit

- **GIVEN** a unit the synced roster does not own
- **WHEN** Estimated is chosen
- **THEN** every cell of its row shows 0 and the row stays listed in the All unit set

#### Scenario: Estimated while estimates are unavailable

- **GIVEN** the clear-estimate configuration or a selected event's battle powers failed to load
- **WHEN** the controls render
- **THEN** Estimated is disabled with "Needs clear estimates", and a URL with `points=estimated` shows Remaining with that note
