# Spec Delta

## ADDED Requirements

### Requirement: Goal dialog checkboxes are named and toggled by their label

In the Create and Edit goal dialogs, every checkbox SHALL have an accessible name equal to its visible label, and activating any part of its label row (text or icon) SHALL toggle it. This covers the goal-type selector, the prerequisite suggestions, the footer options and the acquisition sources. On mobile each such row SHALL be at least 44px tall. Each chip's remove control SHALL have a hit area of at least 24×24px.

#### Scenario: Click the goal-type label

- **WHEN** the user clicks the word "Ascension" in the goal-type selector
- **THEN** the Ascension checkbox becomes checked

#### Scenario: Screen-reader name

- **WHEN** a screen reader focuses the Ascension goal-type checkbox
- **THEN** it announces "Ascension, checkbox"

#### Scenario: Mobile row height

- **GIVEN** a viewport below 768px
- **WHEN** the create sheet shows the goal-type selector
- **THEN** each goal-type row's hit area is at least 44px tall

### Requirement: Keyboard focus is visible on goal dialog controls

In the Create and Edit goal dialogs, a keyboard-focused control SHALL show a focus indicator of at least 2px. That indicator SHALL contrast at least 3:1 with both the control and the surface behind it, in light and dark themes.

#### Scenario: Tab to a checkbox in dark theme

- **WHEN** the user tabs to a goal-type checkbox on the dark card background
- **THEN** a focus indicator at least 2px thick with at least 3:1 contrast against the card is visible
