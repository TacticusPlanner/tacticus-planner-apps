# Spec Delta

## MODIFIED Requirements

### Requirement: The Edit goal dialog contains only editable fields

The Edit goal dialog SHALL show the goal's unit and kind as read-only text (the goal type SHALL NOT be changeable), followed by only these editable fields: the goal target (for kinds that have one, per `goal-target-editing`), the goal's priority, notes, project memberships, and the farming preferences that apply to the goal's kind (rank farming strategy; Unlock/Ascension acquisition sources per `goal-acquisition-source-picker`; farming locations for the remaining kinds; and, for Character Rank, Upgrade, and Machine-of-War Ability goals whose target needs a Mythic upgrade material, the Mythic materials control per `goal-mythic-material-sources`). For a goal with an editable target it SHALL also show a read-only estimate of the resources needed and the estimated days from the goal's start to the draft target, computed as the create preview computes it and refreshed when the draft target or farming preferences change. It SHALL NOT show history, dependencies or prerequisites, blockers, progress, or farming guidance. An Unlock goal, which has no editable target, SHALL show no target section and no estimate.

#### Scenario: Rank goal

- **WHEN** the dialog opens for an Active Rank goal whose target needs no Mythic material
- **THEN** it shows the unit and "Rank" read-only, then the target, priority, notes, projects, farming strategy, and the estimate for its target, and no history, dependencies, blockers, progress, or guidance

#### Scenario: Raising the target updates the estimate

- **GIVEN** the dialog is open for Arjac's Rank goal with a saved target of Gold I
- **WHEN** the user changes the target to Diamond I
- **THEN** the estimate shows the resources and days for the range up to Diamond I

#### Scenario: Rank goal needing a Mythic material

- **WHEN** the dialog opens for an Active Rank goal whose target is Adamantine 2 and needs Venerable Battle Mark
- **THEN** it also shows the Mythic materials control with that goal's selection (or every available offer checked when it has none)

#### Scenario: Editing the target updates the control

- **WHEN** the user lowers that goal's target so that no Mythic material is needed
- **THEN** the Mythic materials control is hidden

#### Scenario: Goal type is fixed

- **WHEN** the dialog is open
- **THEN** no control changes the goal's kind

#### Scenario: Unlock goal

- **WHEN** the dialog opens for an Unlock goal
- **THEN** it shows no target section and no estimate, and shows priority, notes, projects, and acquisition sources

## ADDED Requirements

### Requirement: The Edit goal dialog offers its page tour from its header

The Edit goal dialog's header SHALL include the page tour button, so the dialog's tour can be started while the dialog covers the page header's tour button. This applies on desktop and mobile.

#### Scenario: Start the tour from the dialog

- **WHEN** the Edit goal dialog is open and the user activates its "Tour this page" button
- **THEN** the Edit goal dialog's tour starts

### Requirement: The rank farming-strategy preview follows the edited target

In the Edit goal dialog, the Rank farming-strategy preview SHALL describe the range from the goal's start to the draft target, including the draft additional target. It SHALL NOT describe the saved target.

#### Scenario: Raising Arjac's target

- **GIVEN** Arjac's Rank goal started at Silver I with a saved target of Gold I
- **WHEN** the user changes the target to Diamond I
- **THEN** the farming-strategy preview shows Silver I → Diamond I and its checkpoint count for that range

### Requirement: The target's starting point is shown only when it exists and is labelled

The "Started from" text SHALL appear only when the goal kind has a stored start value; an Upgrade goal without a stored range SHALL NOT show an empty "Started from". An Ability goal's start SHALL name each track. A Character's tracks are Active and Passive; a Machine of War's are Primary and Secondary.

#### Scenario: Upgrade goal without a range

- **WHEN** the dialog opens for Shiron's Upgrade goal, which has no stored range
- **THEN** no "Started from" text is shown

#### Scenario: Machine of War Ability goal

- **WHEN** the dialog opens for Z'Kar's Ability goal that started at primary 48 and secondary 26
- **THEN** the start reads "Primary 48 · Secondary 26"

### Requirement: The farming-locations section states when there is nothing to choose

When the Edit goal dialog shows a farming-locations section and the goal has no farmable location to offer, the section SHALL state that there are no locations to choose for this goal. It SHALL NOT show a heading with nothing under it.

#### Scenario: No locations for a Machine of War Ability goal

- **WHEN** the dialog opens for Z'Kar's Ability goal and no farming location applies
- **THEN** the farming-locations section says there are no locations to choose
