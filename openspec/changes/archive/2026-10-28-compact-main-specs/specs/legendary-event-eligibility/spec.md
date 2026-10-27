## MODIFIED Requirements

### Requirement: Deduct scored points toggle

The leaderboard controls SHALL include a **Deduct scored points** switch, on by default. While on, every points figure on the leaderboards is the unit's remaining points, labelled "remaining"; while off, it is points per battle, labelled "per battle". The order follows the shown figure.

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

The leaderboard controls SHALL include an objective filter listing the current lane's objectives (icon and label) as multi-select chips in the lane's objective order; on the Overview leaderboard the chips SHALL be grouped per lane under Alpha, Beta and Gamma headings in that order, each group listing that lane's objectives, so an objective shared by two lanes appears in each lane's group. When synced progress is available every chip's label SHALL be followed by "cleared / battles" for that lane's objective (the number of the lane's battles whose synced progress has the objective cleared, of the lane's battle count; 0 for a lane with no synced record); when the progress read failed the chips carry no count. A chip's selection is the objective's filter identity, so selecting a shared objective in one group selects it in every group. A unit stays listed only when it satisfies every selected objective (on Overview, on at least one lane for each selected objective). A selection that matches no unit SHALL show a "no unit satisfies these objectives" body with a clear-filter action.

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
