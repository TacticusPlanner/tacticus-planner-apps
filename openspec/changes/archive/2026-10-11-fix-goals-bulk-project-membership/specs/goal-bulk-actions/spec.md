## MODIFIED Requirements

### Requirement: Bulk actions are enabled by the selection

The bulk actions SHALL be Pause, Resume, Add to project and Delete, on both platforms, plus Remove from project while the Goals page is scoped to a project (see "Remove from project takes the selection out of the scoped project"). With no goal selected each SHALL be disabled. With a non-empty selection: Pause SHALL be enabled only when at least one selected goal is Active and not Reached; Resume SHALL be enabled only when at least one selected goal is Paused and not Reached; Add to project and Delete SHALL be enabled for any non-empty selection; Remove from project SHALL be enabled when at least one selected goal's project memberships are known and the account's projects have loaded. Each enabled action's label SHALL carry the count of goals it would act on (for example "Pause (3)"). An action SHALL act on the applicable subset of the selection and skip the rest without error: Pause skips goals that are not Active or are Reached, Resume skips goals that are not Paused or are Reached. A goal whose own request is already in flight SHALL be skipped as well.

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

### Requirement: Add to project adds the selection to one chosen project

Activating Add to project SHALL open a destination picker listing the account's non-archived projects (the Default project included) with their colour dots; when no non-archived project exists it SHALL instead open project creation and, once created, use the new project as the destination. Choosing a destination SHALL add every selected goal to that project in one membership request, keeping each goal's existing memberships; a goal that is already a member SHALL be left as it is. The request SHALL be computed from the destination's membership as read immediately before it, and when that membership changed in the meantime the change SHALL be applied once more to the current membership rather than failing. The request is atomic: when it is rejected (for example because a goal's slot is already occupied in the destination), none of the goals SHALL be added and the reason SHALL be reported once. Membership changes SHALL NOT change any goal's status, target or priority. On success one toast SHALL name the destination and the number of goals added.

#### Scenario: Three goals join a project

- **GIVEN** three goals are selected, one of which already belongs to project B
- **WHEN** the user chooses project B in the picker
- **THEN** one membership request adds the two non-members to B, the member is left as is, every goal keeps its other memberships, and a toast reports 2 goals added to B

#### Scenario: A goal added elsewhere in the meantime is kept

- **GIVEN** two goals are selected and the user opens the picker
- **WHEN** another goal joins project B from another tab before the user chooses B
- **THEN** the selection is added to B and the goal added from the other tab stays in B

#### Scenario: An occupied slot adds nothing

- **GIVEN** three goals are selected and one of them would occupy a slot project B already holds
- **WHEN** the user chooses project B
- **THEN** none of the three goals is added to B and one error names B and the occupied slot

#### Scenario: No project exists yet

- **GIVEN** the account has no non-archived project
- **WHEN** the user activates Add to project
- **THEN** project creation opens instead of a picker, and the created project receives the selection

## ADDED Requirements

### Requirement: Remove from project takes the selection out of the scoped project

While the Goals page is scoped to a project, activating Remove from project SHALL remove the applicable selected goals from that project only, leaving their other memberships, status, target and priority unchanged. Selected goals that belong to another project SHALL be removed without asking anything. When at least one selected goal has the scoped project as its only project, one destination picker SHALL first ask where to move those goals, listing the account's other non-archived projects and offering to create a new project; when no other project exists, project creation SHALL open directly. Choosing a destination SHALL add those goals to it before anything is removed, and the whole selection SHALL then be removed from the scoped project, with one membership request per project. When the destination rejects the goals (for example an occupied slot), nothing SHALL be removed and the reason SHALL be reported once. Dismissing the picker SHALL change nothing and leave the selection intact. On success one toast SHALL report how many goals were removed and, when some were moved, how many went to which project; the selection SHALL then be cleared and the removed goals SHALL leave the scoped list.

#### Scenario: Goals with another project are just removed

- **GIVEN** the page is scoped to project A and the two selected goals also belong to project B
- **WHEN** the user activates Remove from project
- **THEN** no picker opens, both goals leave A in one request and stay in B, and a toast reports 2 goals removed from A

#### Scenario: Last-project goals are moved to a chosen project

- **GIVEN** the page is scoped to project A, and of the two selected goals one belongs only to A and the other also to B
- **WHEN** the user activates Remove from project and chooses project C in the picker
- **THEN** the A-only goal is added to C, then both goals are removed from A, and a toast reports 2 goals removed from A with 1 moved to C

#### Scenario: An occupied destination slot removes nothing

- **GIVEN** a selected goal's only project is A and project C already holds an Active goal in the same slot
- **WHEN** the user chooses C as the destination
- **THEN** no goal is removed from A and one error names C and the occupied slot
