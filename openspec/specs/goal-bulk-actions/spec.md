# goal-bulk-actions Specification

## Purpose

Defines how a user selects several goals on the Goals page and acts on them at once — the select mode and its select bar at every width, the bulk actions (Pause, Resume, Delete, Add to project), their enablement and applicability rules, confirmation, partial-failure reporting, and when a selection is discarded.

## Requirements

### Requirement: Bulk actions are enabled by the selection

The bulk actions SHALL be Pause, Resume, Add to project and Delete, on both platforms, plus Remove from project while the Goals page is scoped to a project (see "Remove from project takes the selection out of the scoped project"). The bulk actions SHALL render only in the select bar, and with no goal selected each SHALL be disabled. With a non-empty selection: Pause SHALL be enabled only when at least one selected goal is Active and not Reached; Resume SHALL be enabled only when at least one selected goal is Paused and not Reached; Add to project and Delete SHALL be enabled for any non-empty selection; Remove from project SHALL be enabled once the account's projects have loaded (a goal's memberships are part of the goals list, so they are always known with the rows). Each enabled action's label SHALL carry the count of goals it would act on (for example "Pause (3)"). An action SHALL act on the applicable subset of the selection and skip the rest without error: Pause skips goals that are not Active or are Reached, Resume skips goals that are not Paused or are Reached. A goal whose own request is already in flight SHALL be skipped as well.

#### Scenario: Nothing selected

- **WHEN** select mode is on and no goal is selected
- **THEN** every bulk action in the select bar is disabled

#### Scenario: Only Paused goals selected

- **GIVEN** the selection holds two Paused goals and nothing else
- **WHEN** the select bar renders
- **THEN** Resume reads "Resume (2)" and is enabled, Pause is disabled, and Add to project and Delete read "(2)" and are enabled

#### Scenario: Mixed selection acts on the applicable subset

- **GIVEN** the selection holds two Active goals, one Paused goal and one Reached goal
- **WHEN** the user activates Pause
- **THEN** only the two Active goals are paused; the Paused and Reached goals are untouched and no error is shown

#### Scenario: Remove from project appears only while scoped

- **GIVEN** two goals are selected
- **WHEN** the select bar renders on the Goals page without a project scope, and again scoped to project A
- **THEN** the unscoped bar has no Remove from project action, and the scoped bar shows "Remove from project (2)", enabled

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

### Requirement: Add to project adds the selection to the chosen projects

Activating Add to project SHALL open a destination picker listing the account's non-archived projects (the Default project included) with their colour dots, where the user can check one or more projects and confirm with **Add**; when no non-archived project exists it SHALL instead open project creation and, once created, use the new project as the destination. For each chosen destination, in turn, the client SHALL add every selected goal to that project in one membership request, keeping each goal's existing memberships; a goal that is already a member SHALL be left as it is. Each request SHALL be computed from the destination's membership as the loaded project list carries it and sent with that membership as `expectedGoalIds`; when the server rejects it as `membershipStale` because the membership changed in the meantime, the change SHALL be re-applied once to the current membership that rejection carries and resubmitted, without a member-list read, rather than failing. Membership is never rejected for an occupied slot (slots are per account, see `goal-project-membership`). Membership changes SHALL NOT change any goal's status, target or priority. On success one toast SHALL name the destinations and the number of goals added; when some requests fail, the toast SHALL name the failed destinations with a Retry for them only, and the successful ones SHALL stay added.

#### Scenario: Three goals join a project

- **GIVEN** three goals are selected, one of which already belongs to project B
- **WHEN** the user checks project B in the picker and confirms
- **THEN** one membership request adds the two non-members to B, the member is left as is, every goal keeps its other memberships, and a toast reports 2 goals added to B

#### Scenario: Two goals join two projects

- **GIVEN** two goals are selected and neither belongs to Chaos Core or Team Lavi
- **WHEN** the user checks both projects and confirms
- **THEN** two membership requests are sent, one per project, and a toast reports "Added 2 goals to Chaos Core and Team Lavi"

#### Scenario: One destination fails

- **GIVEN** the user checked Chaos Core and Team Lavi
- **WHEN** the Team Lavi request fails with a server error
- **THEN** the goals stay added to Chaos Core and the toast reads "Added to Chaos Core. Team Lavi failed." with Retry for Team Lavi only

#### Scenario: A goal added elsewhere in the meantime is kept

- **GIVEN** two goals are selected and the user opens the picker
- **WHEN** another goal joins project B from another tab before the user chooses B
- **THEN** the first request is rejected as `membershipStale`, one retry built from the membership the rejection carries adds the selection to B, and the goal added from the other tab stays in B

#### Scenario: No member-list read precedes the request

- **GIVEN** the projects and goals have loaded
- **WHEN** the user chooses a destination
- **THEN** the membership request is issued without first reading that project's member list

#### Scenario: An occupied slot does not block the add

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

While the Goals page is scoped to a project, activating Remove from project SHALL remove the applicable selected goals from that project only, leaving their other memberships, status, target and priority unchanged. Selected goals that belong to another non-archived project SHALL be removed without asking anything. When at least one selected goal has the scoped project as its only non-archived project, one destination picker SHALL first ask where to move those goals, listing the account's other non-archived projects and offering to create a new project; when no other project exists, project creation SHALL open directly. Choosing a destination SHALL add those goals to it before anything is removed, and the whole selection SHALL then be removed from the scoped project, with one membership request per project. When the goals were added to the destination but the removal from the scoped project then fails, the error SHALL say that they were added to the destination and could not be removed from the scoped project. Dismissing the picker SHALL change nothing and leave the selection intact. On success one toast SHALL report how many goals were removed and, when some were moved, how many went to which project; the selection SHALL then be cleared and the removed goals SHALL leave the scoped list.

#### Scenario: Goals with another project are just removed

- **GIVEN** the page is scoped to project A and the two selected goals also belong to project B
- **WHEN** the user activates Remove from project
- **THEN** no picker opens, both goals leave A in one request and stay in B, and a toast reports 2 goals removed from A

#### Scenario: Last-project goals are moved to a chosen project

- **GIVEN** the page is scoped to project A, and of the two selected goals one belongs only to A and the other also to B
- **WHEN** the user activates Remove from project and chooses project C in the picker
- **THEN** the A-only goal is added to C, then both goals are removed from A, and a toast reports 2 goals removed from A with 1 moved to C

#### Scenario: An occupied destination slot does not block the move

- **GIVEN** a selected goal's only project is A and project C already holds an Active goal of the same unit and kind
- **WHEN** the user chooses C as the destination
- **THEN** the goal is added to C and removed from A — membership is not slot-checked — and the toast reports 1 goal removed from A with 1 moved to C

#### Scenario: A failed removal after the move says where the goals are

- **GIVEN** a selected goal's only project is A and the user chose C as the destination
- **WHEN** the goal is added to C but removing it from A fails
- **THEN** one error says the goal was added to C but could not be removed from A, with the reason

### Requirement: Goals has a select mode at every width

The Goals toolbar SHALL offer a **Select goals** button with an icon and a text label at every width, in the Find slot, like Collection's Select units. It SHALL always be present outside select mode, so the toolbar does not shift as goals load, and SHALL be disabled while goals load or when no row is visible. Pressing it SHALL enter select mode:

- every goal card and table row SHALL show a selection checkbox (in Table view in the row's leading cell, in Cards view first in the card header), and Table view's header SHALL show a select-all checkbox;
- a select bar pinned to the bottom of the viewport SHALL show the number of selected goals, **Select all goals**, the bulk actions (Pause, Resume, Add to project, Delete, and Remove from project while scoped) and **Done**;
- the Select goals button SHALL be hidden until select mode ends.

Outside select mode no checkbox, select-all or select bar renders.

- Toggling a goal's checkbox SHALL add or remove that goal from the selection without triggering any other control of its row or card.
- Select all goals and the table's select-all checkbox SHALL select every currently visible goal, across every group, when not all are selected, and clear the selection when all are. The select-all checkbox SHALL render as indeterminate while some but not all are selected.
- Switching between Table and Cards view SHALL keep the selection.
- A Reached goal SHALL be selectable like any other. Whether each bulk action applies is decided per action (see "Bulk actions are enabled by the selection").
- Each checkbox SHALL have an accessible name identifying the goal, or the select-all action.
- Done SHALL end select mode and discard the selection.
- Below the mobile breakpoint, select mode and reorder mode SHALL be mutually exclusive: entering either SHALL exit the other.

#### Scenario: Entering select mode

- **WHEN** the user presses Select goals
- **THEN** each card or row gains a checkbox and the select bar appears with "0 selected", the bulk actions disabled, Select all goals and Done

#### Scenario: Selecting two goals

- **GIVEN** select mode is on
- **WHEN** the user checks two goals in Table or Cards view
- **THEN** both are selected, the select bar reports two selected goals, and no other control (drag handle, menu, status chip) was activated

#### Scenario: Select all across groups

- **GIVEN** select mode is on, Group by is Type and the visible goals span three groups
- **WHEN** the user presses Select all goals
- **THEN** every goal in all three groups is selected, and pressing it again clears the selection

#### Scenario: The selection survives a view switch

- **GIVEN** two goals are selected in Cards view
- **WHEN** the user switches to Table view
- **THEN** the same two goals are selected and the select bar still reports two

#### Scenario: Done discards the selection

- **GIVEN** select mode is on with two goals selected
- **WHEN** the user presses Done
- **THEN** select mode ends, no checkbox or select bar remains, Select goals is back in the toolbar, and re-entering select mode starts with nothing selected

#### Scenario: Entering reorder mode leaves select mode on mobile

- **GIVEN** a mobile viewport in select mode with one goal selected
- **WHEN** the user taps Reorder
- **THEN** the reorder cards and reorder bar render, select mode is off, and its selection is discarded

#### Scenario: Select goals is present but disabled with nothing to select

- **GIVEN** the goal list is still loading, or the current filters match no goal
- **WHEN** Goals renders
- **THEN** Select goals renders in the toolbar, disabled
