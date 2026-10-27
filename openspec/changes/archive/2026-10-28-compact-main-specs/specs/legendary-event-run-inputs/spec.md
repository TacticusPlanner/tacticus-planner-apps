## MODIFIED Requirements

### Requirement: Run inputs save per run through the plan revision

A change to a run's inputs SHALL show at once and SHALL be saved as one write of that run (`PUT /api/v1/legendary-event-plans/{eventId}/runs/{run}` with the cached plan revision) once changes to that run settle; a run whose settled values equal the stored ones SHALL send nothing. Writes SHALL go through the same queue as team writes, so they never race a team edit in the same tab. Success, conflict and failure SHALL follow the plan write queue (`legendary-event-teams`, "The plan is persisted through the API with one revision"); after a conflict the drawer SHALL show the adopted values. Paid values stored while Show paid options is off SHALL be kept, not cleared.

#### Scenario: Quick edits save once

- **WHEN** the user presses + on run 3 Regular missions ten times in quick succession
- **THEN** the field shows 1 through 10 as pressed, and once the presses settle one write saves run 3 with `regularMissions` 10

#### Scenario: Conflict adopts the other device's values

- **GIVEN** another device saved run 2 with 8 regular missions after this tab loaded the plan
- **WHEN** this tab saves run 2 with 6
- **THEN** the reloaded toast shows and run 2 reads 8

#### Scenario: Turning paid options off keeps the values

- **GIVEN** run 2 stores 10 premium missions
- **WHEN** the user turns Show paid options off and back on
- **THEN** run 2 shows 10 premium missions again
