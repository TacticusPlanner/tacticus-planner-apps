## ADDED Requirements

### Requirement: Day cards show only the goals that receive Onslaught runs that day

A day card's "Onslaught" section SHALL list only the units whose goals receive runs from the shared
Onslaught pool on that day (see goal-farming-estimates: _Onslaught tokens are shared across goals
in priority order_). It SHALL NOT list every goal with Onslaught selected.

#### Scenario: Two Onslaught goals

- **GIVEN** Kharn (priority 1) and Calgar (priority 2) Ascension goals both select Onslaught, and
  Kharn needs Onslaught runs through Day 2
- **WHEN** Schedule renders
- **THEN** Day 1 lists only Kharn under "Onslaught"
- **AND** Calgar first appears under "Onslaught" on the day Kharn's need is met (sharing that
  day's leftover runs) or later
