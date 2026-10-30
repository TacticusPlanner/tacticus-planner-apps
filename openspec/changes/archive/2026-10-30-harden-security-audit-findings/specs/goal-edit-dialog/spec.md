## ADDED Requirements

### Requirement: Goal edits stay within the farming-location rules

Saving a goal's details SHALL send no farming locations for an Ascension goal, even when an older goal stored some. Selecting more than 100 farming locations SHALL show a translated "choose at most 100 locations" message and block Save.

#### Scenario: Editing an Ascension goal's note

- **WHEN** the user edits the note of an Ascension goal whose stored config lists farming locations
- **THEN** the request's `farmingLocationIds` is null

#### Scenario: Too many locations

- **WHEN** the user selects 101 farming locations
- **THEN** the locations section shows the translated limit message and Save is disabled
