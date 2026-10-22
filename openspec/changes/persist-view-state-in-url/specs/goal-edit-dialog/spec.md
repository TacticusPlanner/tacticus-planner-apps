# Spec Delta

## ADDED Requirements

### Requirement: The open Edit goal dialog is addressable

While the Edit goal dialog is open on `/plan/goals`, the edited goal's id SHALL be the `goal` query parameter, pushed as a history entry so Back closes the dialog and keeps the list's other parameters. Closing the dialog by its own controls SHALL remove the parameter. A `goal` value not in the loaded list SHALL be dropped from the URL without opening a dialog.

#### Scenario: Back closes the dialog

- **GIVEN** the user is on `/plan/goals?status=paused` and opens Edit for a goal
- **WHEN** they press Back
- **THEN** the dialog is closed and the URL is `/plan/goals?status=paused`

#### Scenario: Reload reopens the dialog

- **GIVEN** the Edit goal dialog is open for goal G
- **WHEN** the user reloads the page
- **THEN** once the goal list has loaded, the Edit goal dialog for G is open again over the list

#### Scenario: Unknown goal id opens nothing

- **WHEN** the user opens `/plan/goals?goal=not-a-goal`
- **THEN** no dialog opens, the list renders as usual, and the URL is replaced with `/plan/goals`

#### Scenario: Closing with unsaved changes still asks first

- **GIVEN** the Edit goal dialog has unsaved changes
- **WHEN** the user presses Back
- **THEN** the existing unsaved-changes confirmation is shown; choosing to keep editing leaves the dialog open with the `goal` parameter in place, and choosing to discard closes it
