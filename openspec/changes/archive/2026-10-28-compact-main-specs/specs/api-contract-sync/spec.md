## RENAMED Requirements

- FROM: `### Requirement: Failure handling is unchanged`
- TO: `### Requirement: Failed responses surface as typed API errors`

## MODIFIED Requirements

### Requirement: Failed responses surface as typed API errors

A failed API response SHALL still surface as the same typed API error, with status and issue code, plus `current`, field `errors` and extensions when the problem body carries them. Transient-failure classification SHALL be unchanged.

#### Scenario: Conflict still adopts current state

- **WHEN** an edit is rejected with a 409 problem carrying `issueCode` and `current`
- **THEN** the caller receives an API error with that issue code and `current`
