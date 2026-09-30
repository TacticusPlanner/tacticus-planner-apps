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

Reordering affordances on the Goals page and Project Detail SHALL meet the contrast targets and SHALL be identifiable without color. The account-wide priority number on Active and Paused rows (see `consolidate-goals-into-plan-and-remove-active-project`) is text and SHALL meet the 4.5:1 text target in both themes and both densities, including on a row being dragged, and SHALL NOT be conveyed by color alone. The drag handle SHALL have an accessible name and at least 3:1 boundary contrast; a row being dragged SHALL remain legible to the 4.5:1 text target; the mobile reorder mode and its bar SHALL identify their state by text, not only by color; and the order-conflict banner's message and actions SHALL meet the text target and be announced to assistive technology.

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
