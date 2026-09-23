## ADDED Requirements

### Requirement: Consecutive creation retains compatible context

During the current app session in one browser tab, the creation sheet SHALL offer the last successfully chosen project memberships and goal-type choices on a subsequent creation. These choices SHALL remain editable. The sheet SHALL NOT carry a previous unit's target levels, rank ranges, material quantities, or start-paused choice into a new goal. An explicit launch prefill, especially a viewed project's membership, SHALL take precedence over remembered values. A remembered goal type that is unavailable for the newly selected unit SHALL be left unselected.

#### Scenario: Reopen for a related goal

- **WHEN** the user completes a goal and reopens creation in the same app session without an explicit prefill
- **THEN** the last chosen project memberships are offered and compatible goal types can be reselected without carrying the old unit's target values

#### Scenario: Project-scoped launch wins

- **WHEN** the user launches creation from Project Detail after previously choosing different projects
- **THEN** the viewed project is preselected instead of remembered memberships

#### Scenario: Incompatible type is dropped

- **WHEN** a remembered Rank goal type is applied after the user chooses a Machine of War
- **THEN** Rank is not selected and no invalid target configuration is carried forward

#### Scenario: Session boundary

- **WHEN** the application is reloaded or a different browser tab starts a new session
- **THEN** remembered choices are cleared and ordinary default/prefill behavior applies

## MODIFIED Requirements

### Requirement: Create-another success remains immediately usable

The system SHALL retain the create-another flow: after a successful creation with "Create another" enabled, the sheet remains open in an idle submission state for a new goal. It SHALL retain compatible project and goal-type context from the preceding creation while resetting entity-specific targets and start-paused state. The user SHALL be able to edit the retained choices before the next submission.

#### Scenario: Create another after success

- **WHEN** a user submits a valid goal with "Create another" enabled and the creation succeeds
- **THEN** the sheet stays open, the project and compatible goal-type context remain available, unit-specific targets and start-paused reset, and the submit action is no longer shown as submitting
