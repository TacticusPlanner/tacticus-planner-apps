# Spec Delta

## ADDED Requirements

### Requirement: Navigation shows a live indicator for a running Hero Release Event

While an HRE is running, the HRE navigation entry SHALL show the same live indicator as the HSE entry, in the same renderers and with the same accessibility rules. The parent Dailies entry SHALL show the indicator while an HSE or an HRE is running. Activity SHALL be decided in UTC, with the HRE tab's own selection of the running HRE. Loading and calendar errors SHALL show no indicator.

#### Scenario: Only an HRE running

- **GIVEN** Zapspitta's HRE is running and no HSE is active
- **THEN** the HRE entry and the Dailies entry show the indicator, and the HSE entry does not

#### Scenario: Neither running

- **GIVEN** no HSE and no HRE is active
- **THEN** no indicator is shown
