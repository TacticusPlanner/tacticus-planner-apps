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

### Requirement: The Edit goal dialog contains only editable fields

The Edit goal dialog SHALL show the goal's unit and kind as read-only text (the goal type SHALL NOT be changeable), followed by only these editable fields, in this order: the goal's priority (first, on desktop and mobile), the goal target (for kinds that have one, per `goal-target-editing`), notes, project memberships, and the farming preferences that apply to the goal's kind (rank farming strategy; Unlock/Ascension acquisition sources per `goal-acquisition-source-picker`; farming locations for the remaining kinds; and, for Character Rank, Upgrade, and Machine-of-War Ability goals whose target needs a Mythic upgrade material, the Mythic materials control per `goal-mythic-material-sources`). For a goal with an editable target it SHALL also show a read-only estimate of the resources needed and the estimated days from the goal's start to the draft target, computed as the create preview computes it and refreshed when the draft target or farming preferences change. It SHALL NOT show history, dependencies or prerequisites, blockers, progress, or farming guidance. An Unlock goal, which has no editable target, SHALL show no target section and no estimate.

#### Scenario: Rank goal

- **WHEN** the dialog opens for an Active Rank goal whose target needs no Mythic material
- **THEN** it shows the unit and "Rank" read-only, then priority, the target, notes, projects, farming strategy, and the estimate for its target, and no history, dependencies, blockers, progress, or guidance

#### Scenario: Raising the target updates the estimate

- **GIVEN** the dialog is open for Arjac's Rank goal with a saved target of Gold I
- **WHEN** the user changes the target to Diamond I
- **THEN** the estimate shows the resources and days for the range up to Diamond I

#### Scenario: Goal type is fixed

- **WHEN** the dialog is open
- **THEN** no control changes the goal's kind

#### Scenario: Unlock goal

- **WHEN** the dialog opens for an Unlock goal
- **THEN** it shows no target section and no estimate, and shows priority, notes, projects, and acquisition sources
