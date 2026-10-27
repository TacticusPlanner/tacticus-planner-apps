## MODIFIED Requirements

### Requirement: Creation files goals in a project targeting the event

Review SHALL offer the destination project (`project-event-target`). Create SHALL, in order: create the project when new; create each unit's goals with one combined goal creation; remove, update and create the teams through the plan's write queue; save the edited run inputs. Each item SHALL show pending, done or failed. **Retry failed** SHALL resend only failed items and SHALL be available whenever Create is not running. While a failed item remains, leaving SHALL ask first. When every item is done, the app SHALL return to Overview with a pluralised toast linking to the project.

#### Scenario: Existing event project

- **GIVEN** the active project "Uthar run 3" targets Uthar
- **WHEN** Review renders
- **THEN** the destination defaults to "Uthar run 3"

#### Scenario: New project

- **GIVEN** no project targets Uthar and the target is Unlock
- **WHEN** the user presses Create
- **THEN** the project "Uthar · Unlock" is created with the Uthar target before any goal, and every goal is created in it

#### Scenario: Partial failure

- **GIVEN** one unit's goal creation fails with a slot conflict
- **WHEN** creation finishes
- **THEN** that row shows the conflict message, Retry failed is enabled at once, and leaving asks "Some items failed. Leave without retrying?"

#### Scenario: One goal

- **WHEN** a plan with one goal and two teams is created
- **THEN** the toast reads "Plan created: 1 goal, 2 teams"
