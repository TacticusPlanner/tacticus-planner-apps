## MODIFIED Requirements

### Requirement: A Reached goal renders as a completed row or card

Wherever the Goals list renders (desktop table or mobile cards, on the Goals page, with or without a project scope), a goal whose computed attainment is Reached SHALL render with a green-tinted row/card background and a completed check mark beside its status label, and its status label SHALL read "Reached" in place of its stored "Active"/"Paused" label. This is display only: the goal's stored status, priority position, and sort order SHALL NOT change. On the desktop table, the Progress and Remaining values, and the "Done by" estimate content, SHALL each render as "-" for a Reached goal. A Reached goal's card SHALL omit its estimate, progress and remaining content entirely, with no "-" placeholder in their place, and SHALL offer a Delete button in its footer (see `goal-deletion`). Its Character and Goal cells (unit, from → to target) SHALL render as for any other goal. The tint and check mark SHALL meet the contrast requirements of `goal-visual-accessibility` in both themes, and the state SHALL be conveyed by the check mark and label as well as by color.

#### Scenario: A reached Active goal on the desktop table

- **GIVEN** a goal with stored status `Active` whose target is reached
- **WHEN** the desktop table renders its row
- **THEN** the row has a green-tinted background, its status cell shows a check mark and "Reached", and its Progress, Remaining and Done by values each read "-"

#### Scenario: A reached Paused goal keeps its stored status

- **GIVEN** a goal with stored status `Paused` whose target is reached
- **WHEN** its row renders
- **THEN** the label reads "Reached" and no request changes the goal's stored status

#### Scenario: A reached goal on a mobile card

- **GIVEN** a goal whose target is reached
- **WHEN** the mobile card renders
- **THEN** the card has the same green tint, check mark and "Reached" label, shows no progress, remaining or estimate content and no "-" placeholder for them, and its footer offers a Delete button

#### Scenario: Reached goals appear under the Reached filter, not hidden

- **GIVEN** the status filter is set to "Reached"
- **WHEN** the list renders
- **THEN** every Reached goal is listed as a completed row, in the same priority order as other rows

### Requirement: The Remaining column shows resource chips, not prose
