# Spec Delta

## MODIFIED Requirements

### Requirement: The list stays in its loading state until row membership is known

The Goals list SHALL show its loading skeleton, and no goal rows, "filters match nothing" line, or empty-project card, until the rows it shows are decided: the goal list (which carries every goal's configuration and project memberships); for a requested project scope, the project list as well; and, on Unfulfilled and Reached, the player-data tables attainment reads. No per-goal or per-project read SHALL be awaited. A failed request or a never-synced table SHALL count as decided. Active, Paused, and Blocked do not wait on attainment.

#### Scenario: Reached goals never flash on Unfulfilled

- **GIVEN** three Active goals of which one is reached
- **WHEN** Goals opens on Unfulfilled and the goal list loads
- **THEN** the skeleton stays until the player-data attainment reads are decided, and then exactly the two unreached goals render; the reached goal is never rendered on Unfulfilled, and no per-goal read is issued

#### Scenario: Deep-linked scope waits for its members

- **GIVEN** the user opens `/plan/goals?project={id}` for one of their projects with one member goal
- **WHEN** the goal list has loaded but the project list has not
- **THEN** the skeleton shows and neither goal rows nor the "filters match nothing" line render; once the project list loads, the one member goal renders without any further request

#### Scenario: Unsynced player data does not hang the list

- **GIVEN** the player-data tables have never been synced
- **WHEN** Goals opens on Unfulfilled and the goal list has loaded
- **THEN** the skeleton clears and the rows render, treating the unsynced tables as decided
