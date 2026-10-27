## ADDED Requirements

### Requirement: Schedule location labels are shown in full

Campaign names and node labels in Today's schedule rows, and in the shared location row reused by the Home raids widget, SHALL be rendered in full in every supported locale (en, de, es, fr) at every supported viewport width. When a label does not fit on one line it SHALL wrap rather than be cut off with an ellipsis.

#### Scenario: Long localized campaign name on mobile

- **WHEN** the app language is de or fr and a schedule row's campaign name is wider than the label column below 768px
- **THEN** the full campaign name is visible, wrapped onto additional lines, and the row's icons and raid-count badge remain aligned

#### Scenario: English labels are unchanged

- **WHEN** the app language is en and every label fits on one line
- **THEN** rows render on a single line exactly as before
