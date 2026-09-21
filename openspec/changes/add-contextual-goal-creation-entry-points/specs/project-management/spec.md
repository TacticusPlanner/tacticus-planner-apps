## ADDED Requirements

### Requirement: The detail route offers a Create Goal action alongside Add Goals

The detail route SHALL provide a Create Goal action alongside its existing Add Goals action. Where Add Goals assigns an existing, currently-unassigned goal to the viewed project, Create Goal SHALL start a brand-new goal already scoped to the viewed project. Both actions SHALL be visible without hovering, focusing, or opening another control.

#### Scenario: Create Goal is offered next to Add Goals

- **WHEN** a project's detail route renders its header
- **THEN** a Create Goal action is visible next to the existing Add Goals action

#### Scenario: Create Goal starts a new goal scoped to the project

- **WHEN** the user activates Create Goal on a project's detail route
- **THEN** the goal-creation sheet opens with that project preselected, distinct from the existing-goal assembly surface Add Goals opens
