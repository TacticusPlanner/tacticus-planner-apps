## ADDED Requirements

### Requirement: Goal creation offers an explicit start-paused option

The creation sheet SHALL offer a control that creates the goal in the Paused status instead of the Active one. The control SHALL default to off, SHALL be visible in the form rather than reached through a menu or a hover-only affordance, and SHALL state what choosing it means — that the goal is created but left out of daily planning until it is resumed. Its value SHALL be sent with the submission so that the created goal's status reflects the user's choice, and SHALL apply to every goal a single submission creates, including the prerequisite goals of a combined creation. The control SHALL reset to off whenever the form resets for a subsequent creation.

#### Scenario: Default creation is active

- **WHEN** the user creates a goal without touching the start-paused control
- **THEN** the created goal is Active

#### Scenario: Choosing start paused

- **WHEN** the user turns the start-paused control on and creates a goal
- **THEN** the created goal is Paused and is listed under the status filter that shows paused goals

#### Scenario: A combined creation is paused as a whole

- **GIVEN** the form has auto-suggested prerequisite goals alongside the requested one
- **WHEN** the user turns the start-paused control on and submits
- **THEN** every goal created by that submission, prerequisites included, is Paused

#### Scenario: The control is discoverable

- **WHEN** the creation sheet renders at either breakpoint
- **THEN** the start-paused control and its explanation are visible in the form without hovering, focusing, or opening another control

#### Scenario: The choice does not carry into the next creation

- **GIVEN** the user created a goal with start-paused on and chose to create another
- **WHEN** the form is presented again
- **THEN** the start-paused control is off
