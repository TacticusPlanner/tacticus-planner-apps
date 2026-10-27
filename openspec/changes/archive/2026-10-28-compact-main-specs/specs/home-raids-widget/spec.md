## MODIFIED Requirements

### Requirement: Home page renders Daily Raids after Your Projects

The authenticated home page SHALL render a Daily Raids section in the position defined by `home-projects-widget` "Home page renders Your Projects after Token Availability".

#### Scenario: Desktop shows Daily Raids beside Projects

- **WHEN** a signed-in user opens `/home` at or above the 768px breakpoint
- **THEN** Daily Raids renders side by side with Your Projects, below Token Availability and above the events calendar
