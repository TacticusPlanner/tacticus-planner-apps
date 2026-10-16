## ADDED Requirements

### Requirement: The list stays in its loading state until row membership is known

The Goals list SHALL show its loading skeleton, and no goal rows, "filters match nothing" line, or empty-project card, until the rows it shows are decided: the goal list; for a requested project scope, the project list and that project's member list; and, on Unfulfilled and Reached, each candidate goal's detail and the player-data tables attainment reads. A failed request or a never-synced table SHALL count as decided. Active, Paused, and Blocked do not wait on attainment.

#### Scenario: Reached goals never flash on Unfulfilled

- **GIVEN** the account has three goals, one of which is already reached
- **WHEN** Goals opens on Unfulfilled and the goal list loads before the goals' details
- **THEN** the skeleton stays until every detail has loaded, and then exactly the two unreached goals render; the reached goal is never rendered on Unfulfilled

#### Scenario: Deep-linked scope waits for its members

- **GIVEN** the user opens `/plan/goals?project={id}` for one of their projects with one member goal
- **WHEN** the goal list and project list have loaded but that project's member list has not
- **THEN** the skeleton shows and neither goal rows nor the "filters match nothing" line render; once the member list loads, the one member goal renders

#### Scenario: Unsynced player data does not hang the list

- **GIVEN** the player has never synced their roster
- **WHEN** Goals opens on Unfulfilled and the goal details have loaded
- **THEN** the skeleton clears and the goals render as not reached

### Requirement: Late page notices render below the list

The estimates-failed notice (with its retry) and the "no farmable demand" line SHALL render below the goal list, not between the controls and the list, so their arrival after the rows does not move the rows. This is the same on desktop and mobile.

#### Scenario: Estimates fail after the rows render

- **GIVEN** goal rows are visible
- **WHEN** the plan estimates request fails
- **THEN** the estimates-failed notice appears below the last row and the rows do not move
