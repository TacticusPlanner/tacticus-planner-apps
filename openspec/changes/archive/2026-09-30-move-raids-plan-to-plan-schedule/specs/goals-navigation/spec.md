## MODIFIED Requirements

### Requirement: Planning Settings is a Goals-only control

The Plan section SHALL render its Planning Settings entry point on the Goals subpage and on the Schedule subpage (trailing Schedule's project selector). Projects and Insights SHALL NOT render a Planning Settings entry point of their own. Every entry point opens the same dialog over the same persisted setting.

#### Scenario: Planning Settings visible on Overview

- **WHEN** the user opens Goals
- **THEN** a Planning Settings control is visible and opens the planning settings dialog

#### Scenario: Planning Settings visible on Schedule

- **WHEN** the user opens Schedule
- **THEN** a Planning Settings control is visible after the project selector and opens the same planning settings dialog

#### Scenario: Planning Settings absent from Projects and Insights

- **WHEN** the user opens Projects or Insights
- **THEN** no Planning Settings control is rendered on that page

### Requirement: The Goals page is the single goals list and plan

The Plan section SHALL have one goals page, **Goals** at `/plan/goals`, replacing both the former All Goals page and the former Global Plan page. Goals SHALL list goals in canonical global priority order and SHALL NOT offer a Sort control or any other sort mode. Wherever another requirement in the specs says "Overview", "Goals Overview", "All Goals", or "Global Plan" for this page, it means Goals. The Plan section's child pages are Goals, Projects, Insights, and Schedule, in that order.

#### Scenario: Plan tabs

- **WHEN** the Plan section's child-page picker renders
- **THEN** it lists Goals, Projects, Insights, and Schedule, and no Global Plan or All Goals entry

#### Scenario: No sort control

- **WHEN** the user opens Goals
- **THEN** the controls offer status, Type, project-membership filters and Group, and no Sort control
