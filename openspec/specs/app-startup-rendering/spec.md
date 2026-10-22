# app-startup-rendering Specification

## Purpose

Defines what the user sees between the entry document and the first rendered route: a loading indicator in the persisted theme rather than a blank page or a light-mode flash.

## Requirements

### Requirement: Translation loading shows a loading indicator

While the initial translation resources are loading, the app SHALL render the same loading indicator used during authentication, not an empty page.

#### Scenario: Slow connection on first visit

- **WHEN** the entry document has loaded but the first translation namespaces are still downloading
- **THEN** the user sees the loading indicator until the first route renders

### Requirement: The persisted theme is applied before first paint

When the user has an explicit theme preference stored, or System resolves to dark, the document SHALL already be in that theme when the entry document first paints, so no light-to-dark flash occurs.

#### Scenario: Dark preference on reload

- **GIVEN** the user previously chose the Dark theme
- **WHEN** they reload the app
- **THEN** the first painted frame is dark and stays dark

#### Scenario: No stored preference with a dark system theme

- **GIVEN** no stored preference and a dark operating-system theme
- **WHEN** the app loads
- **THEN** the first painted frame is dark

#### Scenario: Storage blocked

- **GIVEN** a browser that blocks site storage
- **WHEN** the app loads
- **THEN** the first frame follows the system theme and no error is raised
