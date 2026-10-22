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

### Requirement: Bulk actions are enabled by the selection

The bulk actions SHALL be Pause, Resume, Add to project and Delete, on both platforms, plus Remove from project while the Goals page is scoped to a project (see "Remove from project takes the selection out of the scoped project"). With no goal selected each SHALL be disabled. With a non-empty selection: Pause SHALL be enabled only when at least one selected goal is Active and not Reached; Resume SHALL be enabled only when at least one selected goal is Paused and not Reached; Add to project and Delete SHALL be enabled for any non-empty selection; Remove from project SHALL be enabled once the account's projects have loaded (a goal's memberships are part of the goals list, so they are always known with the rows). Each enabled action's label SHALL carry the count of goals it would act on (for example "Pause (3)"). An action SHALL act on the applicable subset of the selection and skip the rest without error: Pause skips goals that are not Active or are Reached, Resume skips goals that are not Paused or are Reached. A goal whose own request is already in flight SHALL be skipped as well.

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

#### Scenario: Remove from project appears only while scoped

- **GIVEN** two goals are selected
- **WHEN** the actions row renders on the Goals page without a project scope, and again scoped to project A
- **THEN** the unscoped row has no Remove from project action, and the scoped row shows "Remove from project (2)", enabled

### Requirement: Bulk pause and resume act on the selection only

Bulk Pause and Resume SHALL transition exactly the applicable selected goals in one request, and SHALL NOT cascade to any goal outside the selection — a prerequisite listed in a selected goal's `dependsOn` that is not itself selected keeps its status (unlike the row menu's Pause/Resume, see `goal-status-actions`). The request is atomic: either every goal in it transitions or none does. Every affected row SHALL update optimistically before the request resolves and SHALL revert together if the request fails. When the request is rejected because a goal conflicts (for example resuming a goal whose slot another in-flight goal now holds), the API reports the first conflict (`slotOccupied`, the conflicting goal under `current`) and one error SHALL name that goal and the goal holding its slot; when it succeeds no success toast SHALL be shown. Every affected row SHALL be disabled for further actions until the request finishes.

#### Scenario: An unselected prerequisite is left alone

- **GIVEN** goal B lists goal A in its `dependsOn`, both are Active, and only B is selected
- **WHEN** the user activates bulk Pause
- **THEN** B is paused and A remains Active

#### Scenario: One request for the selection

- **GIVEN** three Active goals are selected
- **WHEN** bulk Pause runs
- **THEN** exactly one request carrying the three goal ids is issued and all three rows show Paused from its response

#### Scenario: Partial failure reports a count

- **GIVEN** three Paused goals are selected and one of them can no longer resume because another in-flight goal holds its slot
- **WHEN** bulk Resume runs
- **THEN** no goal is resumed, all three rows revert to Paused, and one error names the conflicting goal and the goal holding its slot and states that 0 of 3 goals were updated

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

Activating Add to project SHALL open a destination picker listing the account's non-archived projects (the Default project included) with their colour dots; when no non-archived project exists it SHALL instead open project creation and, once created, use the new project as the destination. Choosing a destination SHALL add every selected goal to that project in one membership request, keeping each goal's existing memberships; a goal that is already a member SHALL be left as it is. The request SHALL be computed from the destination's membership as the loaded project list carries it, and when that membership changed in the meantime the change SHALL be applied once more to the current membership rather than failing. Membership is never rejected for an occupied slot (slots are per account, see `goal-project-membership`). Membership changes SHALL NOT change any goal's status, target or priority. On success one toast SHALL name the destination and the number of goals added.

#### Scenario: Three goals join a project

- **GIVEN** three goals are selected, one of which already belongs to project B
- **WHEN** the user chooses project B in the picker
- **THEN** one membership request adds the two non-members to B, the member is left as is, every goal keeps its other memberships, and a toast reports 2 goals added to B

#### Scenario: A goal added elsewhere in the meantime is kept

- **GIVEN** two goals are selected and the user opens the picker
- **WHEN** another goal joins project B from another tab before the user chooses B
- **THEN** the selection is added to B and the goal added from the other tab stays in B

#### Scenario: No member-list read precedes the request

- **GIVEN** the projects and goals have loaded
- **WHEN** the user chooses a destination
- **THEN** the membership request is issued without first reading that project's member list

#### Scenario: An occupied slot adds nothing

- **GIVEN** three goals are selected and one of them has the same unit and kind as a goal already in project B
- **WHEN** the user chooses project B
- **THEN** all three goals are added to B — membership is not slot-checked — and the toast reports 3 goals added

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

### Requirement: Remove from project takes the selection out of the scoped project

While the Goals page is scoped to a project, activating Remove from project SHALL remove the applicable selected goals from that project only, leaving their other memberships, status, target and priority unchanged. Selected goals that belong to another project SHALL be removed without asking anything. When at least one selected goal has the scoped project as its only project, one destination picker SHALL first ask where to move those goals, listing the account's other non-archived projects and offering to create a new project; when no other project exists, project creation SHALL open directly. Choosing a destination SHALL add those goals to it before anything is removed, and the whole selection SHALL then be removed from the scoped project, with one membership request per project. When the goals were added to the destination but the removal from the scoped project then fails, the error SHALL say that they were added to the destination and could not be removed from the scoped project. Dismissing the picker SHALL change nothing and leave the selection intact. On success one toast SHALL report how many goals were removed and, when some were moved, how many went to which project; the selection SHALL then be cleared and the removed goals SHALL leave the scoped list.

#### Scenario: Goals with another project are just removed

- **GIVEN** the page is scoped to project A and the two selected goals also belong to project B
- **WHEN** the user activates Remove from project
- **THEN** no picker opens, both goals leave A in one request and stay in B, and a toast reports 2 goals removed from A

#### Scenario: Last-project goals are moved to a chosen project

- **GIVEN** the page is scoped to project A, and of the two selected goals one belongs only to A and the other also to B
- **WHEN** the user activates Remove from project and chooses project C in the picker
- **THEN** the A-only goal is added to C, then both goals are removed from A, and a toast reports 2 goals removed from A with 1 moved to C

#### Scenario: An occupied destination slot removes nothing

- **GIVEN** a selected goal's only project is A and project C already holds an Active goal of the same unit and kind
- **WHEN** the user chooses C as the destination
- **THEN** the goal is added to C and removed from A — membership is not slot-checked — and the toast reports 1 goal removed from A with 1 moved to C

#### Scenario: A failed removal after the move says where the goals are

- **GIVEN** a selected goal's only project is A and the user chose C as the destination
- **WHEN** the goal is added to C but removing it from A fails
- **THEN** one error says the goal was added to C but could not be removed from A, with the reason
