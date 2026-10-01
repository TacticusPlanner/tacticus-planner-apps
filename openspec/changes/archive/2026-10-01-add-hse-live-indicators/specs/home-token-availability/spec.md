## ADDED Requirements

### Requirement: Token Availability shares its row with the Home Screen Events card

Token Availability SHALL remain the first section of the home page but, at or above 768px, SHALL occupy half of its row alongside the Home Screen Events card (see `home-events-widget`) instead of the full width; its token entries SHALL wrap so none is clipped. Below 768px it remains full width, with the Home Screen Events card stacked directly after it. This supersedes the "full width on both desktop and mobile" wording of "Home page renders Token Availability as its first section" for desktop.

#### Scenario: Desktop half-width

- **WHEN** a signed-in user opens `/home` at or above 768px
- **THEN** Token Availability is the first section, side by side with Home Screen Events, and every token entry is visible

#### Scenario: Mobile full width

- **WHEN** a signed-in user opens `/home` below 768px
- **THEN** Token Availability is full width and first, followed directly by Home Screen Events
