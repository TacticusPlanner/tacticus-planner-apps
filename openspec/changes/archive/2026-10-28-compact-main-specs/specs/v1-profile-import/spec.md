## MODIFIED Requirements

### Requirement: An unselected part occupies no row in the result

A part the user did not select SHALL NOT occupy a row in the result. The result
SHALL report an outcome for every part the import was asked to process, and only those parts, so a cleared part
cannot be mistaken for one that was attempted and skipped.

#### Scenario: A cleared part has no row

- **GIVEN** the user cleared the guild token part
- **WHEN** the import completes
- **THEN** no row for the guild token part appears in the result

#### Scenario: Selected parts each keep a row

- **GIVEN** the user selected the personal API key part and the goals part
- **WHEN** the import completes
- **THEN** the result has a row for each of those two parts

## REMOVED Requirements

### Requirement: Each selected part's outcome is reported

**Reason**: D13 — restates "An unselected part occupies no row in the result", whose scenario "Selected parts each keep a row" already asserts the positive half.

**Migration**: `v1-profile-import` "An unselected part occupies no row in the result" now states that every processed part, and only those, gets an outcome.
