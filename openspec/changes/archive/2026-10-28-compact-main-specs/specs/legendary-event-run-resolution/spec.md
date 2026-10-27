## MODIFIED Requirements

### Requirement: The unknown state plans one conservative run

In the unknown state the run forecast header SHALL read "By the end of the next run: …". The token supply (`legendary-event-run-forecast`), reward projection (`legendary-event-reward-projection`) and clear depths (`legendary-event-teams`) follow their own unknown-run rules.

#### Scenario: Forecast for an unknown run

- **WHEN** the Overview renders for an event in the unknown state
- **THEN** its header reads "By the end of the next run: …", and no run number appears on the Overview
