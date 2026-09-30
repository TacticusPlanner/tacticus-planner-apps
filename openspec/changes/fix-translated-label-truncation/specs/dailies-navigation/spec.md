## ADDED Requirements

### Requirement: Navigation labels and the project selector are shown in full

Dailies tab labels (mobile section tabs and the desktop section menu) and the Today project selector's selected value and placeholder SHALL be rendered in full in every supported locale (en, de, es, fr). The project selector's trigger SHALL size to its content rather than clip it; tab labels SHALL never be truncated.

#### Scenario: Long localized tab label on mobile

- **WHEN** the app language is de or fr and the Dailies tab labels together exceed the viewport width below 768px
- **THEN** every tab label is shown in full and the tab row scrolls horizontally

#### Scenario: Long project name on desktop

- **WHEN** the app language is de or fr and the selected project's name is wider than the selector's default width at or above 768px
- **THEN** the selector trigger widens to show the full name
