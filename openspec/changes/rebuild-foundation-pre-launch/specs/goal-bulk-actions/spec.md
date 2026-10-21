# Spec Delta

## MODIFIED Requirements

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
