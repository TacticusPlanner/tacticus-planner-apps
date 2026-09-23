## MODIFIED Requirements

### Requirement: Current plan supplies the implicit project selection

Project-aware browsing views such as Insights SHALL initially select Current plan when available, falling back to Default only when no Current plan is available. This selection SHALL filter or summarize results from the one global execution plan; it SHALL NOT select which goals run in the Today or Raids Plan tabs or create an alternate project-only raid plan. Other Dailies recommendation pages may keep a project-focus lens for team/purchase presentation under their own specifications, but that lens SHALL NOT change the global raid/estimate allocation. Route navigation to project detail SHALL NOT update the persisted browsing preference.

#### Scenario: Dailies defaults to Current plan

- **GIVEN** a Current plan and a different Default project
- **WHEN** the user opens Dailies Today or Raids Plan
- **THEN** the Raids tabs show the account-wide Active-goal plan without using either project as execution scope

#### Scenario: Default project is the fallback

- **GIVEN** no Current plan and a Default project
- **WHEN** project-aware Insights needs an initial browsing filter
- **THEN** it selects Default without changing the global plan results

#### Scenario: Browsing a project does not change implicit selection

- **GIVEN** project A is Current plan
- **WHEN** the user navigates to project B and later opens Insights
- **THEN** Insights initially browses A unless the user explicitly chooses another filter, while the Raids tabs remain global
