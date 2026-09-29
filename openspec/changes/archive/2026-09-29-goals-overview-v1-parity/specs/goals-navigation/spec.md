## MODIFIED Requirements

### Requirement: Shared status filter control

Overview and a project's detail route SHALL each present the same status filter — Unfulfilled, Reached, Blocked, Active, Paused — as a single select control defaulting to Unfulfilled. There SHALL be no "Archived" option. Each option except Blocked SHALL show its count of matching goals. The Reached option lists Reached goals in the same list presentation as every other option; Reached goals SHALL NOT be omitted from any option they otherwise match (see `goal-list-layout` for how a Reached row renders).

#### Scenario: Status filter defaults to Unfulfilled

- **WHEN** the user opens Overview or a project's detail route
- **THEN** the status filter shows "Unfulfilled" as the selected value and the goal list reflects only unfulfilled goals

#### Scenario: Selecting a status filters the goal list

- **WHEN** the user selects "Reached" from the status filter
- **THEN** the goal list updates to show only Reached goals, and the control retains the selected value

#### Scenario: No Archived option

- **WHEN** the user opens the status filter
- **THEN** the options are Unfulfilled, Reached, Blocked, Active and Paused, and no "Archived" option is offered

### Requirement: Reached-goal indicator on the status filter

When there is at least one goal in the Reached status and the status filter's current selection is not "Reached", the status filter's trigger SHALL show a visual indicator that Reached goals exist. The indicator SHALL NOT be shown while "Reached" is the current selection, or when there are no goals in the Reached status.

#### Scenario: Indicator appears when Reached goals exist and are not being viewed

- **GIVEN** at least one goal has reached status and the status filter is currently set to "Unfulfilled"
- **WHEN** the page renders
- **THEN** the status filter's trigger shows the reached-goal indicator

#### Scenario: Indicator hidden while viewing Reached

- **GIVEN** at least one goal has reached status
- **WHEN** the status filter is set to "Reached"
- **THEN** the status filter's trigger does not show the indicator

#### Scenario: Indicator hidden when there are no reached goals

- **GIVEN** no goals currently have reached status
- **WHEN** the page renders with the status filter set to any value other than "Reached"
- **THEN** the status filter's trigger does not show the indicator
