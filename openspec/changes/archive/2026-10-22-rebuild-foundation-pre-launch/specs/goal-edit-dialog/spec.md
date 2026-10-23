# Spec Delta

## MODIFIED Requirements

### Requirement: One Save submits every change

The dialog SHALL have one Save button and a Cancel. Save SHALL be enabled only when at least one field differs from the loaded goal and all validation passes (a valid target per `goal-target-editing` when the target section changed, at least one project, and valid location/source choices). Save SHALL submit every changed section (target, goal fields, project memberships, priority) in one atomic request, so either all changes are saved or none are. When it succeeds the dialog SHALL close and the list SHALL reflect the changes from the response without a full reload. If the request fails, the dialog SHALL stay open, keep the whole draft, and name what failed; nothing SHALL be shown as saved.

#### Scenario: Several fields at once

- **WHEN** the user changes the target, notes, and priority and saves
- **THEN** the target, notes, and position are all saved by that one action and the dialog closes

#### Scenario: Nothing changed

- **WHEN** the dialog opens and no field changes
- **THEN** Save is disabled

#### Scenario: Untouched target does not block Save

- **WHEN** the owner edits only notes, priority or projects of a goal whose stored target would not pass target validation (for example an untargeted Machine-of-War Ability track stored below its start)
- **THEN** no target error is shown, Save is enabled, and the request carries no target section

#### Scenario: Untargeted Ability track

- **WHEN** the owner changes only one Ability track's target
- **THEN** the other track's select shows its start level and the request sends it at its start, as creation does

#### Scenario: One section fails, nothing is saved

- **GIVEN** the user changed the target and the projects
- **WHEN** the request is rejected because the new target is already held by another in-flight goal of the same unit
- **THEN** the dialog stays open with the whole draft and a conflict message naming that goal, and neither the target nor the projects were saved

#### Scenario: Stale target revision

- **WHEN** the goal changed elsewhere and the request is rejected as stale
- **THEN** the dialog keeps the draft, saves nothing, and offers refresh-and-retry per `goal-target-editing`

### Requirement: The dialog loads and fails visibly

Opening the dialog SHALL read the goal fresh from the server once, so the draft and its revision start from the current goal even when the list was loaded earlier. While that read is in flight the dialog SHALL show a skeleton rather than empty fields. If the goal fails to load or no longer exists, it SHALL show an error with a way to close, and SHALL NOT offer Save.

#### Scenario: Loading

- **WHEN** the dialog opens before the goal has loaded
- **THEN** a skeleton renders and Save is not offered

#### Scenario: Opening re-reads the goal

- **GIVEN** the goals list was loaded a minute ago
- **WHEN** the user opens a goal's Edit dialog
- **THEN** exactly one read of that goal is issued and the fields show the values it returns

#### Scenario: Load failure

- **WHEN** the goal cannot be loaded
- **THEN** an error message and a close control render, with no Save
