## MODIFIED Requirements

### Requirement: The estimate column is labeled Done By

On the desktop Goals list, the computed estimate column SHALL be labeled "Done By". Mobile cards SHALL continue to show the same estimate content inline. Global Plan SHALL use plan-aware dates from the account-wide schedule without requiring a project selection. The goal-detail sheet remains a separate surface and labels isolated versus plan-aware figures according to the computation used.

#### Scenario: Desktop table header reads Done By

- **GIVEN** the Global Plan or Goals list renders with a plan-aware estimate
- **WHEN** the desktop table header renders
- **THEN** the estimate column reads Done By, not Est.

### Requirement: The Done By cell shows a formatted date and day count

For a successfully estimated goal, the Done By cell SHALL show a calendar icon, a short localized date, and an "in {{days}} days" caption from the same estimate result. Desktop and mobile presentations SHALL contain the same content. A Blocked goal SHALL show its blocker and no date; a goal with no computed estimate SHALL show the unavailable placeholder. A project filter SHALL show the goal's global-plan date, not a project-only recalculation. Dates retain `goal-farming-estimates`' inclusive Day-1 semantics and UTC-safe formatting.

#### Scenario: A goal 12 days from completion shows its date and day count

- **GIVEN** a goal's global estimate is 12 days with completion on September 28
- **WHEN** Done By renders on desktop or mobile
- **THEN** it shows a calendar icon and Sep 28 above "in 12 days"

#### Scenario: A blocked goal is unaffected

- **WHEN** a goal's estimate is Blocked
- **THEN** Done By shows its blocked indicator and no date or day count

#### Scenario: A goal with no estimate is unaffected

- **WHEN** no estimate exists because the goal is non-farmable or planning data is unavailable
- **THEN** Done By shows the unavailable placeholder, not a fabricated date
