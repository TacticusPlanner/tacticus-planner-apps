## MODIFIED Requirements

### Requirement: Mobile offers a select mode mirroring reorder mode

Below the mobile breakpoint, the Goals control row SHALL offer an icon-only select-mode toggle with an accessible name, beside the reorder-mode toggle. While select mode is active, every card SHALL show a checkbox in its header, a bottom bar pinned to the viewport SHALL show the number of selected goals, the four bulk actions (Pause, Resume, Add to project, Delete) and a Done control, and the toggle SHALL read as pressed. Done SHALL exit select mode and discard the selection. Select mode and reorder mode SHALL be mutually exclusive: entering either SHALL exit the other. Outside select mode no card shows a checkbox and no bottom bar renders. The select-mode toggle SHALL always be present below the mobile breakpoint, so the control row does not shift as goals load; it SHALL be enabled whenever at least one goal row is visible and disabled while goals load or when no row is visible.

#### Scenario: Entering select mode

- **WHEN** a mobile user activates the select-mode toggle
- **THEN** each card gains a header checkbox and a bottom bar appears with "0 selected", the four actions disabled, and a Done control

#### Scenario: Done discards the selection

- **GIVEN** select mode is active with two goals selected
- **WHEN** the user activates Done
- **THEN** select mode ends, no checkbox or bottom bar remains, and re-entering select mode starts with nothing selected

#### Scenario: Entering reorder mode leaves select mode

- **GIVEN** select mode is active with one goal selected
- **WHEN** the user activates the reorder-mode toggle
- **THEN** the reorder cards and reorder bar render, select mode is off, and its selection is discarded

#### Scenario: Toggle is present but disabled with nothing to select

- **GIVEN** the goal list is still loading, or the current filters match no goal
- **WHEN** Goals is viewed below the 768px breakpoint
- **THEN** the select-mode toggle renders in the control row, disabled, with its accessible name
