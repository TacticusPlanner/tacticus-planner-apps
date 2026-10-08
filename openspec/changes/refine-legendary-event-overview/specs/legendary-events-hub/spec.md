# Spec Delta

## MODIFIED Requirements

### Requirement: The Overview tab summarises the event

The Overview tab SHALL show, in order: the Run status card (unchanged from its requirement); a **lane summary** with one row per lane (Alpha, Beta, Gamma) carrying the lane's earned points of its maximum as text and a bar, the count of fully cleared battles of the lane's battle count, and an **objectives line** with one indicator per lane objective in the lane's objective order (the objective's icon, "cleared / battles" where cleared is the number of the lane's battles whose synced progress has that objective cleared, and a bar in the same accent colour as the lane bar); and the cross-lane Eligibility leaderboard (specified in `legendary-event-eligibility`). Activating a lane summary row SHALL select that lane's tab and scroll the page so that lane's Synced progress grid is at the top of the viewport (below the sticky strip on mobile). When the synced progress read failed the lane summary SHALL show "synced data unavailable" in place of the figures and the objectives line; when the event has no synced entry it SHALL show 0 of the maximum for each lane and 0 of the battle count for each objective.

#### Scenario: Lane summary figures

- **GIVEN** Lysander's synced entry yields Alpha 3,410 of 9,000 earned with 7 of 18 battles fully cleared
- **WHEN** Overview renders
- **THEN** the Alpha row reads "3,410 / 9,000" with a bar at about 38% and "7 / 18 battles"

#### Scenario: Lane summary objective counts

- **GIVEN** Lysander Alpha has five objectives and the synced entry clears the first objective in 11 of 18 battles, the fourth in 7 and the fifth in 8
- **WHEN** Overview renders
- **THEN** the Alpha objectives line shows five indicators whose first reads "11 / 18" with a bar at about 61%, the fourth "7 / 18" and the fifth "8 / 18", each headed by the objective's icon

#### Scenario: Lane summary jumps to the grid

- **WHEN** the user activates the Beta row
- **THEN** the Beta tab becomes selected and the Beta Synced progress grid heading is scrolled into view

#### Scenario: Progress unavailable

- **GIVEN** the `lre-progress` read rejected
- **WHEN** Overview renders
- **THEN** each lane row shows "synced data unavailable", no objectives line, and remains activatable

#### Scenario: No synced entry

- **GIVEN** the event has no synced entry, or a lane has no synced record
- **WHEN** Overview renders
- **THEN** that lane's objectives line reads "0 / 18" for every objective
