## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Desktop rows can be selected individually or all at once

**Reason**: Checkboxes on every desktop row and card made Goals busier than Collection; selection is now a mode at every width, as on Collection.

**Migration**: See "Goals has a select mode at every width".

### Requirement: Mobile offers a select mode mirroring reorder mode

**Reason**: The mobile select mode now applies at every width.

**Migration**: See "Goals has a select mode at every width".
