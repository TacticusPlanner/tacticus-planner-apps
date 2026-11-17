## MODIFIED Requirements

### Requirement: The Goals page is the single goals list and plan

The Plan section SHALL have one goals page, **Goals** at `/plan/goals`, replacing both the former All Goals page and the former Global Plan page. Goals SHALL list goals in canonical global priority order and SHALL NOT offer a Sort control or any other sort mode. Wherever another requirement in the specs says "Overview", "Goals Overview", "All Goals", or "Global Plan" for this page, it means Goals. The Plan section's child pages are Goals, Projects, Insights, Schedule, and Event shop, in that order.

#### Scenario: Plan tabs

- **WHEN** the Plan section's child-page picker renders
- **THEN** it lists Goals, Projects, Insights, Schedule, and Event shop, and no Global Plan or All Goals entry

#### Scenario: No sort control

- **WHEN** the user opens Goals
- **THEN** the controls offer status, Type, project-membership filters and Group, and no Sort control
