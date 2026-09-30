## MODIFIED Requirements

### Requirement: The estimate column is labeled Done By

On the desktop Goals list, the computed estimate column SHALL be labeled "Done By". Mobile cards SHALL continue to show the same estimate content inline. Global Plan SHALL use plan-aware dates from the account-wide schedule without requiring a project selection.

#### Scenario: Desktop table header reads Done By

- **GIVEN** the Global Plan or Goals list renders with a plan-aware estimate
- **WHEN** the desktop table header renders
- **THEN** the estimate column reads Done By, not Est.
