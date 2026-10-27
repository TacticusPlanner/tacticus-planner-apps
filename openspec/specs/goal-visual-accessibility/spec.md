# goal-visual-accessibility Specification

## Purpose

Ensures goal state and progress remain distinguishable and readable in light and dark themes, including compact presentation and mobile cards.

## Requirements

### Requirement: Goal text and meaningful graphics meet contrast targets

On the Goals page, Project Detail, and the goal dialogs, normal text SHALL have at least 4.5:1 contrast against its actual background; large text SHALL have at least 3:1; and meaningful non-text component/state cues SHALL have at least 3:1 against adjacent colors, following WCAG 2.2 AA criteria 1.4.3 and 1.4.11. This SHALL hold in light and dark themes and in both Comfortable and Compact density where available.

#### Scenario: Dense light and dark goals

- **WHEN** a populated Goals view renders in either theme and density
- **THEN** labels, counts, badges, controls, progress fills/markers, and focus/state cues meet the applicable contrast target on their rendered backgrounds

### Requirement: Goal state is not communicated by color alone

Active, Paused, Blocked/Restricted, Reached, and Archived states SHALL be distinguishable by visible text or an identified icon in addition to color wherever they are displayed. Progress layers and restriction markers SHALL have an accessible explanation independent of hue.

#### Scenario: Color is unavailable

- **WHEN** a user views goal rows/cards without relying on hue differences
- **THEN** goal status and restriction remain identifiable from text or icon plus accessible name

#### Scenario: Mobile progress

- **WHEN** a mobile goal card shows Actual/Potential progress or a restriction marker
- **THEN** the meanings remain available by text or an operable explanation, not only by colored fills

#### Scenario: Paused goals in the priority order

- **WHEN** the Goals page lists Paused goals among Active ones in priority order
- **THEN** each Paused row is identifiable by text or an icon, not only by muted color

### Requirement: Reorder controls and states are perceivable

Reordering affordances on the Goals page and Project Detail SHALL meet the contrast targets and SHALL be identifiable without color. The account-wide priority number on Active and Paused rows (see `goal-list-layout`) is text and SHALL meet the 4.5:1 text target in both themes and both densities, including on a row being dragged, and SHALL NOT be conveyed by color alone. The drag handle SHALL have an accessible name and at least 3:1 boundary contrast; a row being dragged SHALL remain legible to the 4.5:1 text target; the mobile reorder mode and its bar SHALL identify their state by text, not only by color; and the order-conflict banner's message and actions SHALL meet the text target and be announced to assistive technology.

#### Scenario: Drag handle without color

- **WHEN** a user views a reorderable Active or Paused row without relying on hue
- **THEN** the drag handle is identifiable by its icon and accessible name and its boundary meets 3:1 in both themes

#### Scenario: Priority number is legible

- **WHEN** an Active or Paused row's priority number renders in either theme, in Comfortable or Compact density, or on a mobile card
- **THEN** its text meets 4.5:1 against the row's rendered background and it is also exposed in the row's accessible name

#### Scenario: Row while dragging

- **WHEN** a row is being dragged in either theme
- **THEN** its text stays at or above 4.5:1 against the row's rendered background

#### Scenario: Order conflict announced

- **WHEN** a reorder is rejected because the order changed elsewhere
- **THEN** the conflict banner's message and Retry/Dismiss actions meet the text contrast target and the message is announced to assistive technology

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
