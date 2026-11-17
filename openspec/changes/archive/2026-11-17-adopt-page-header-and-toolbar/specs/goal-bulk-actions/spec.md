## MODIFIED Requirements

### Requirement: Desktop rows can be selected individually or all at once

At or above the mobile breakpoint, every goal on the Goals page (`/plan/goals`, with or without a project scope) SHALL carry a selection checkbox in both views:

- in Table view, in the row's leading cell, before the priority number and drag handle;
- in Cards view, first in the card header, before the priority number and drag handle.

A select-all checkbox SHALL also be present: in the table header in Table view, and once above the goal groups in Cards view, because a label under a group heading would read as selecting that group only.

- Toggling a goal's checkbox SHALL add or remove that goal from the selection without triggering any other control of its row or card.
- The select-all checkbox SHALL select every currently visible goal, across every group when Group is set, when not all are selected. It SHALL clear the selection when all visible goals are selected, and SHALL render as indeterminate while some but not all are selected.
- Switching between Table and Cards view SHALL keep the current selection.
- A Reached goal SHALL be selectable like any other. Whether each bulk action applies is decided per action (see "Bulk actions are enabled by the selection").
- Each checkbox SHALL have an accessible name identifying the goal, or the select-all action for the select-all checkbox. Both views SHALL expose the select-all checkbox under the same test id, so tours and tests target it in either view.

#### Scenario: Selecting two rows

- **WHEN** the user checks the checkboxes of two rows in Table view, or of two cards in Cards view
- **THEN** both goals are selected, the bulk actions row reports two selected goals, and no other control (drag handle, menu, status chip) was activated

#### Scenario: Select all visible across groups

- **GIVEN** Group is set to goal type and the visible goals span three groups
- **WHEN** the user checks the select-all checkbox, in the table header or above the goal groups
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
- **THEN** the same two goals are selected and the bulk actions row still reports two selected goals

### Requirement: Mobile offers a select mode mirroring reorder mode

Below the mobile breakpoint, the Goals toolbar SHALL offer an icon-only select-mode toggle with an accessible name, beside the reorder-mode toggle. While select mode is active, every card SHALL show a checkbox in its header, a bottom bar pinned to the viewport SHALL show the number of selected goals, the four bulk actions (Pause, Resume, Add to project, Delete) and a Done control, and the toggle SHALL read as pressed. Done SHALL exit select mode and discard the selection. Select mode and reorder mode SHALL be mutually exclusive: entering either SHALL exit the other. Outside select mode no card shows a checkbox and no bottom bar renders. The select-mode toggle SHALL always be present below the mobile breakpoint, so the control row does not shift as goals load; it SHALL be enabled whenever at least one goal row is visible and disabled while goals load or when no row is visible.

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
- **THEN** the select-mode toggle renders in the toolbar, disabled, with its accessible name

### Requirement: Bulk actions are enabled by the selection

The bulk actions SHALL be Pause, Resume, Add to project and Delete, on both platforms, plus Remove from project while the Goals page is scoped to a project (see "Remove from project takes the selection out of the scoped project"). With no goal selected the desktop bulk actions row SHALL NOT render, and in the mobile select-mode bar each action SHALL be disabled. With a non-empty selection: Pause SHALL be enabled only when at least one selected goal is Active and not Reached; Resume SHALL be enabled only when at least one selected goal is Paused and not Reached; Add to project and Delete SHALL be enabled for any non-empty selection; Remove from project SHALL be enabled once the account's projects have loaded (a goal's memberships are part of the goals list, so they are always known with the rows). Each enabled action's label SHALL carry the count of goals it would act on (for example "Pause (3)"). An action SHALL act on the applicable subset of the selection and skip the rest without error: Pause skips goals that are not Active or are Reached, Resume skips goals that are not Paused or are Reached. A goal whose own request is already in flight SHALL be skipped as well.

#### Scenario: Nothing selected

- **WHEN** no goal is selected on desktop
- **THEN** no bulk actions row renders under the Goals toolbar

#### Scenario: Only Paused goals selected

- **GIVEN** the selection holds two Paused goals and nothing else
- **WHEN** the bulk actions row renders
- **THEN** Resume reads "Resume (2)" and is enabled, Pause is disabled, and Add to project and Delete read "(2)" and are enabled

#### Scenario: Mixed selection acts on the applicable subset

- **GIVEN** the selection holds two Active goals, one Paused goal and one Reached goal
- **WHEN** the user activates Pause
- **THEN** only the two Active goals are paused; the Paused and Reached goals are untouched and no error is shown

#### Scenario: Remove from project appears only while scoped

- **GIVEN** two goals are selected
- **WHEN** the bulk actions row renders on the Goals page without a project scope, and again scoped to project A
- **THEN** the unscoped row has no Remove from project action, and the scoped row shows "Remove from project (2)", enabled
