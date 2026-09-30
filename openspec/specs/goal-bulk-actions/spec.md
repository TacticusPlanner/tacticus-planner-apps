# goal-bulk-actions Specification

## Purpose

Defines how a user selects several goals on the Goals page and acts on them at once — the desktop checkbox column, the mobile select mode, the four bulk actions (Pause, Resume, Delete, Add to project), their enablement and applicability rules, confirmation, partial-failure reporting, and when a selection is discarded.

## Requirements

### Requirement: Desktop rows can be selected individually or all at once

At or above the mobile breakpoint, every goal row on the Goals page (`/plan/goals`, with or without a project scope) SHALL carry a selection checkbox in its leading cell, before the priority number and drag handle, and the table header SHALL carry a select-all checkbox. Toggling a row's checkbox SHALL add or remove that goal from the selection without triggering any other row control. The header checkbox SHALL select every currently visible row — across every group when Group is set — when not all are selected, and SHALL clear the selection when all visible rows are selected; it SHALL render as indeterminate while some but not all visible rows are selected. A Reached row SHALL be selectable like any other row; applicability of individual bulk actions is decided per action (see "Bulk actions are enabled by the selection"). Each checkbox SHALL have an accessible name identifying the goal (or, for the header, the select-all action).

#### Scenario: Selecting two rows

- **WHEN** the user checks the checkboxes of two rows
- **THEN** both rows are selected, the actions row reports two selected goals, and no other row control (drag handle, menu) was activated

#### Scenario: Select all visible across groups

- **GIVEN** Group is set to goal type and the visible rows span three groups
- **WHEN** the user checks the header checkbox
- **THEN** every row in all three groups is selected

#### Scenario: Header checkbox clears a full selection

- **GIVEN** every visible row is selected
- **WHEN** the user activates the header checkbox
- **THEN** the selection is empty

#### Scenario: Partial selection shows indeterminate

- **GIVEN** three of five visible rows are selected
- **WHEN** the header renders
- **THEN** the header checkbox is in its indeterminate state

### Requirement: Mobile offers a select mode mirroring reorder mode

Below the mobile breakpoint, the Goals control row SHALL offer an icon-only select-mode toggle with an accessible name, beside the reorder-mode toggle. While select mode is active, every card SHALL show a checkbox in its header, a bottom bar pinned to the viewport SHALL show the number of selected goals, the four bulk actions (Pause, Resume, Add to project, Delete) and a Done control, and the toggle SHALL read as pressed. Done SHALL exit select mode and discard the selection. Select mode and reorder mode SHALL be mutually exclusive: entering either SHALL exit the other. Outside select mode no card shows a checkbox and no bottom bar renders. The select-mode toggle SHALL be present whenever at least one goal row is visible.

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

### Requirement: Bulk actions are enabled by the selection

The bulk actions SHALL be Pause, Resume, Add to project and Delete, on both platforms. With no goal selected each SHALL be disabled. With a non-empty selection: Pause SHALL be enabled only when at least one selected goal is Active and not Reached; Resume SHALL be enabled only when at least one selected goal is Paused and not Reached; Add to project and Delete SHALL be enabled for any non-empty selection. Each enabled action's label SHALL carry the count of goals it would act on (for example "Pause (3)"). An action SHALL act on the applicable subset of the selection and skip the rest without error: Pause skips goals that are not Active or are Reached, Resume skips goals that are not Paused or are Reached. A goal whose own request is already in flight SHALL be skipped as well.

#### Scenario: Nothing selected

- **WHEN** no goal is selected on desktop
- **THEN** Pause, Resume, Add to project and Delete render in the actions row, all disabled, with no count

#### Scenario: Only Paused goals selected

- **GIVEN** the selection holds two Paused goals and nothing else
- **WHEN** the actions row renders
- **THEN** Resume reads "Resume (2)" and is enabled, Pause is disabled, and Add to project and Delete read "(2)" and are enabled

#### Scenario: Mixed selection acts on the applicable subset

- **GIVEN** the selection holds two Active goals, one Paused goal and one Reached goal
- **WHEN** the user activates Pause
- **THEN** only the two Active goals are paused; the Paused and Reached goals are untouched and no error is shown

### Requirement: Bulk pause and resume act on the selection only

Bulk Pause and Resume SHALL transition exactly the applicable selected goals, one request per goal, and SHALL NOT cascade to any goal outside the selection — a prerequisite listed in a selected goal's `dependsOn` that is not itself selected keeps its status (unlike the row menu's Pause/Resume, see `goal-status-actions`). Every affected row SHALL update optimistically before its request resolves and SHALL revert individually if its own request fails. When some requests fail, one aggregate error SHALL report how many of the total succeeded; when all succeed no success toast SHALL be shown. Every affected row SHALL be disabled for further actions until the whole operation finishes.

#### Scenario: An unselected prerequisite is left alone

- **GIVEN** goal B lists goal A in its `dependsOn`, both are Active, and only B is selected
- **WHEN** the user activates bulk Pause
- **THEN** B is paused and A remains Active

#### Scenario: Partial failure reports a count

- **GIVEN** three Active goals are selected
- **WHEN** bulk Pause runs and one request fails
- **THEN** the two successful goals stay Paused, the failed one reverts to Active, and one error reads that 2 of 3 goals were updated

### Requirement: Bulk delete confirms once and removes immediately

Activating bulk Delete SHALL open one confirmation naming the number of goals and stating that deletion is account-wide and permanent. Confirming SHALL remove every selected goal from every list immediately (the behaviour `goal-deletion` requires per goal), then issue one delete request per goal sequentially. A goal whose request fails SHALL be restored and the failure reported once in aggregate; a successful bulk delete SHALL show no success toast. Cancelling SHALL leave the selection intact.

#### Scenario: Confirmation names the count

- **GIVEN** four goals are selected
- **WHEN** the user activates Delete
- **THEN** a confirmation asks about deleting 4 goals and warns the deletion is permanent and account-wide

#### Scenario: Confirmed delete clears the rows at once

- **WHEN** the user confirms the bulk delete
- **THEN** all four rows disappear before any request resolves, and the selection is empty

#### Scenario: One failed delete comes back

- **GIVEN** a bulk delete of three goals where one request fails
- **WHEN** the failure is received
- **THEN** that goal reappears in its lists and one error is shown; the other two stay deleted

### Requirement: Add to project adds the selection to one chosen project

Activating Add to project SHALL open a destination picker listing the account's non-archived projects (the Default project included) with their colour dots; when no non-archived project exists it SHALL instead open project creation and, once created, use the new project as the destination. Choosing a destination SHALL add each selected goal to that project while keeping the goal's existing memberships, one request per goal; a goal that is already a member SHALL be skipped. Membership changes SHALL NOT change any goal's status, target or priority. On completion one success toast SHALL name the destination and the number of goals added; a partial failure SHALL be reported once in aggregate.

#### Scenario: Three goals join a project

- **GIVEN** three goals are selected, one of which already belongs to project B
- **WHEN** the user chooses project B in the picker
- **THEN** the two non-members are added to B, the member is left as is, every goal keeps its other memberships, and a toast reports 2 goals added to B

#### Scenario: No project exists yet

- **GIVEN** the account has no non-archived project
- **WHEN** the user activates Add to project
- **THEN** project creation opens instead of a picker, and the created project receives the selection

### Requirement: The selection is discarded when the list changes or an action completes

The selection SHALL be cleared whenever the set of rows the list shows changes by user control — a change of the status filter, the Type filter, the project scope, or Group — and after any bulk action finishes (whether fully or partially successful). It SHALL NOT be cleared by a reorder drop, by opening a row's menu, or by a background refetch that keeps the same rows.

#### Scenario: Changing the status filter clears the selection

- **GIVEN** two goals are selected under "Unfulfilled"
- **WHEN** the user switches the status filter to "Paused"
- **THEN** nothing is selected and the bulk actions are disabled

#### Scenario: A reorder keeps the selection

- **GIVEN** two goals are selected
- **WHEN** the user drags another row to a new position
- **THEN** the same two goals remain selected

#### Scenario: A completed bulk pause clears the selection

- **GIVEN** three Active goals are selected under "Unfulfilled"
- **WHEN** bulk Pause completes
- **THEN** the three rows remain visible, now Paused, and nothing is selected
