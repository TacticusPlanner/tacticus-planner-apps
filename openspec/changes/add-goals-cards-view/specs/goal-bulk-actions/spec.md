## MODIFIED Requirements

### Requirement: Desktop rows can be selected individually or all at once

At or above the mobile breakpoint, every goal on the Goals page (`/plan/goals`, with or without a project scope) SHALL carry a selection checkbox in both views:

- in Table view, in the row's leading cell, before the priority number and drag handle;
- in Cards view, first in the card header, before the priority number and drag handle.

A select-all checkbox SHALL also be present: in the table header in Table view, and in a bar directly above the cards grid (above the Actual/Potential legend, when that renders) in Cards view.

- Toggling a goal's checkbox SHALL add or remove that goal from the selection without triggering any other control of its row or card.
- The select-all checkbox SHALL select every currently visible goal, across every group when Group is set, when not all are selected. It SHALL clear the selection when all visible goals are selected, and SHALL render as indeterminate while some but not all are selected.
- Switching between Table and Cards view SHALL keep the current selection.
- A Reached goal SHALL be selectable like any other. Whether each bulk action applies is decided per action (see "Bulk actions are enabled by the selection").
- Each checkbox SHALL have an accessible name identifying the goal, or the select-all action for the select-all checkbox. Both views SHALL expose the select-all checkbox under the same test id, so tours and tests target it in either view.

#### Scenario: Selecting two rows

- **WHEN** the user checks the checkboxes of two rows in Table view, or of two cards in Cards view
- **THEN** both goals are selected, the actions row reports two selected goals, and no other control (drag handle, menu, status chip) was activated

#### Scenario: Select all visible across groups

- **GIVEN** Group is set to goal type and the visible goals span three groups
- **WHEN** the user checks the select-all checkbox, in the table header or above the cards grid
- **THEN** every goal in all three groups is selected

#### Scenario: Header checkbox clears a full selection

- **GIVEN** every visible goal is selected
- **WHEN** the user activates the select-all checkbox
- **THEN** the selection is empty

#### Scenario: Partial selection shows indeterminate

- **GIVEN** three of five visible goals are selected
- **WHEN** the select-all checkbox renders, in either view
- **THEN** it is in its indeterminate state

#### Scenario: The selection survives a view switch

- **GIVEN** two goals are selected in Cards view
- **WHEN** the user switches to Table view
- **THEN** the same two goals are selected and the actions row still reports two selected goals
