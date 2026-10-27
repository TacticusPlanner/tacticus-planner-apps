## MODIFIED Requirements

### Requirement: Failure handling is unchanged

A failed API response SHALL still surface as the same typed API error, with status, issue code, `current`, field `errors` and extensions read from the problem body. Transient-failure classification SHALL be unchanged.

#### Scenario: Conflict still adopts current state

- **WHEN** an edit is rejected with a 409 problem carrying `issueCode` and `current`
- **THEN** the caller receives an API error with that issue code and `current`
