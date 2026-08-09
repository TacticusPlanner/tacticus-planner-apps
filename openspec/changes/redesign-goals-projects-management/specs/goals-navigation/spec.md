## Purpose

Defines Current plan terminology and selection behavior across Goals and Dailies so project focus is presented consistently and is not confused with project or goal lifecycle status.

## MODIFIED Requirements

### Requirement: Consistent project selector

Every Goals or Dailies subpage that includes a project selector SHALL use the shared project-selector component and SHALL identify the project whose `isActivePlan` value is true as the **Current plan**. It SHALL NOT label that relationship merely “Active.” Project color, Current plan, and default-project markers SHALL be presented consistently everywhere the selector appears.

#### Scenario: Insights uses Current plan terminology

- **WHEN** the user opens Goals Insights
- **THEN** its shared project selector identifies the persisted current project with the “Current plan” marker

#### Scenario: Goal lifecycle remains Active

- **WHEN** a goal with lifecycle status `Active` is shown near a Current plan marker
- **THEN** the goal status remains labeled “Active” and the selected project is labeled “Current plan,” making the two concepts distinguishable

## ADDED Requirements

### Requirement: Current plan supplies the implicit project selection

Project-aware Dailies and Insights views SHALL initially select the Current plan when one is available and SHALL fall back to the default project only when no Current plan is available. Route navigation to a project detail SHALL NOT update this persisted preference.

#### Scenario: Dailies defaults to Current plan

- **GIVEN** one project is the Current plan and another is the default project
- **WHEN** the user opens Dailies without a local project selection
- **THEN** Dailies selects the Current plan

#### Scenario: Default project is the fallback

- **GIVEN** no available project is marked Current plan and a default project exists
- **WHEN** a project-aware view needs an implicit selection
- **THEN** it selects the default project

#### Scenario: Browsing a project does not change implicit selection

- **GIVEN** project A is the Current plan
- **WHEN** the user navigates to project B's detail and later opens Dailies
- **THEN** Dailies still defaults to project A unless the user explicitly made another project current
