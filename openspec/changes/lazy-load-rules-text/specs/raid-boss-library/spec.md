# Spec Delta

## ADDED Requirements

### Requirement: Rules text loads per ability panel after the detail view paints

The detail view SHALL render the roster, header, weapons, abilities and traits before any rules text has
downloaded, fetching only the text of the shown abilities (one file per ability) and the trait text. While an
ability's text is downloading its panel SHALL show a loading state in place of the text.

#### Scenario: Detail view paints before the text

- **WHEN** a user opens a boss on a slow connection
- **THEN** the boss's name, progression stepper, weapons and ability names are visible before any rules
  text has arrived, and each ability panel shows its loading state until its text resolves

#### Scenario: Only the shown abilities are fetched

- **WHEN** a boss with five shown abilities is opened
- **THEN** the browser requests those five abilities' text files and no other ability's file

### Requirement: A failed rules-text download is retryable per panel

If an ability's text download fails, its panel SHALL show a failure note with a retry control instead of the
name-only rendering, and retrying SHALL request that text again. When the download succeeds but no text
exists, the name-only rendering of the existing requirement applies.

#### Scenario: Text download fails

- **GIVEN** an ability's text request fails
- **WHEN** the panel settles
- **THEN** it shows the failure note with a retry control, and activating retry requests the file again
  and renders the text when it arrives

#### Scenario: No text after a successful load

- **GIVEN** the text request succeeds but there is no file for the ability
- **WHEN** the panel settles
- **THEN** only the ability name is shown, with no failure note and no empty description area
