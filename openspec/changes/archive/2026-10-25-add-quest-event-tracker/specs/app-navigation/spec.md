# Spec Delta

## ADDED Requirements

### Requirement: Navigation shows a live indicator for a running Quest Event

While a quest is running, the Quest navigation entry SHALL show the same live indicator as the HSE and HRE entries, in the same renderers and with the same accessibility rules. The parent Dailies entry SHALL show the indicator while an HSE, an HRE or a quest is running; this supersedes the HSE-or-HRE rule. Activity SHALL be decided in UTC with the Quest tab's own "running" rule. Loading and calendar errors SHALL show no indicator.

#### Scenario: Only a quest running

- **GIVEN** Nubari's quest is running, and no HSE or HRE is
- **THEN** the Quest entry and the Dailies entry show the indicator, and the HSE and HRE entries do not
