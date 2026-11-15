# Spec Delta

## MODIFIED Requirements

### Requirement: Priority is chosen with a position select

For an Active or Paused goal the dialog SHALL show a Priority field using the priority picker (`goal-priority-picker`), whose options are the positions 1 to N, where N is the number of Active and Paused goals in the account-wide order (`global-goal-priority`), each naming the goal at that position, preselected to the goal's current position. Saving a different position SHALL move the goal to that position with every goal between shifting one place toward the vacated position, exactly as a drag reorder of the same goal to that position would. A goal that holds no global position (any other status) SHALL show no Priority field. A Reached goal keeps its stored status and its position, and so shows the field.

#### Scenario: Move up

- **GIVEN** five in-flight goals A, B, C, D, E in that order
- **WHEN** the user opens E's dialog, selects position 3 (which names C), and saves
- **THEN** the order becomes A, B, E, C, D

#### Scenario: Move down

- **GIVEN** the same five goals
- **WHEN** the user opens C's dialog, selects position 5, and saves
- **THEN** the order becomes A, B, D, E, C

#### Scenario: Unchanged position

- **WHEN** the user saves without changing the Priority field
- **THEN** no reorder is submitted

#### Scenario: Order changed elsewhere

- **WHEN** the account's goal order changed since the dialog opened and the save's reorder is rejected as stale
- **THEN** the dialog stays open with the draft, states the order changed, and offers a way to reload the current order before retrying
