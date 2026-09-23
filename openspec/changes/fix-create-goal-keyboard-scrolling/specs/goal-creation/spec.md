## ADDED Requirements

### Requirement: Creation sheet remains keyboard-scrollable

The Create Goal sheet SHALL allow keyboard-only users to reach every applicable field, validation message, and submission/close action at short viewport heights. Keyboard scrolling SHALL move the form's scrollable content where applicable while the sheet retains modal focus containment. Mouse and touch scrolling SHALL continue to work.

#### Scenario: Keyboard navigation through a tall form

- **WHEN** a keyboard-only user opens a Create Goal form taller than the viewport and tabs through its fields
- **THEN** focused fields scroll into view and every applicable field and action remains reachable

#### Scenario: Normal scroll keys

- **WHEN** focus is on a non-text-entry control within the scrollable form and content extends below the viewport
- **THEN** normal keyboard scroll input moves the form content rather than being swallowed by the page or sheet

#### Scenario: Modal focus remains contained

- **WHEN** the sheet is open and a user tabs past its last focusable control
- **THEN** focus remains within the sheet instead of moving to the page behind it
