## Purpose

Keeps mobile shell-tour guidance aligned with sticky and fixed navigation targets as the viewport scrolls or changes height.

## ADDED Requirements

### Requirement: Shell tour targets remain aligned

On mobile, the general tour SHALL spotlight the visible header for its header step and the visible bottom navigation for its navigation step. The associated callout and controls SHALL remain visible and operable when the page is scrolled or the viewport height changes.

#### Scenario: Sticky header after scrolling

- **WHEN** the user reaches the mobile header step after scrolling the page
- **THEN** the spotlight aligns with the visible sticky header and the callout remains inside the visible viewport

#### Scenario: Fixed bottom navigation on a short viewport

- **WHEN** the user reaches the final mobile navigation step on a short viewport
- **THEN** the spotlight aligns with the visible fixed navigation and the callout controls remain operable above it

#### Scenario: Return to an earlier step

- **WHEN** the user navigates back to the header step after visiting a later step
- **THEN** the header target is measured in its current visible position, not a stale earlier rectangle
