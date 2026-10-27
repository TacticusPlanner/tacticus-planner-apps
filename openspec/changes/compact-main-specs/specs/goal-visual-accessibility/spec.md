## MODIFIED Requirements

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
