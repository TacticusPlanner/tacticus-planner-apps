# Spec Delta

## MODIFIED Requirements

### Requirement: The Edit goal dialog contains only editable fields

The Edit goal dialog SHALL show the goal's unit and kind as read-only text (the goal type SHALL NOT be changeable), followed by only these editable fields, in this order: the goal's priority (first, on desktop and mobile), the goal target (for kinds that have one, per `goal-target-editing`), notes, project memberships, and the farming preferences that apply to the goal's kind (rank farming strategy; Unlock/Ascension acquisition sources per `goal-acquisition-source-picker`; farming locations for the remaining kinds; and, for Character Rank, Upgrade, and Machine-of-War Ability goals whose target needs a Mythic upgrade material, the Mythic materials control per `goal-mythic-material-sources`). For a goal with an editable target it SHALL also show a read-only estimate of the resources needed and the estimated days still needed to reach the draft target, computed as the create preview computes it and refreshed when the draft target or farming preferences change. The estimate SHALL run from where the unit is now: the later of the goal's stored start and the unit's synced rank, progression or ability levels, less the upgrades applied on that rank and the owned inventory, as the create preview counts them; without synced data it SHALL run from the stored start. It SHALL NOT show history, dependencies or prerequisites, blockers, progress, or farming guidance. An Unlock goal, which has no editable target, SHALL show no target section and no estimate.

#### Scenario: Rank goal

- **WHEN** the dialog opens for an Active Rank goal whose target needs no Mythic material
- **THEN** it shows the unit and "Rank" read-only, then priority, the target, notes, projects, farming strategy, and the estimate for its target, and no history, dependencies, blockers, progress, or guidance

#### Scenario: Estimate after progress

- **GIVEN** a Rank goal created at Gold I targeting Diamond I, and the synced roster shows the character at Gold II with two upgrades applied
- **WHEN** the Edit goal dialog opens
- **THEN** the range reads Gold II → Diamond I and the estimate leaves out the Gold I upgrades and the two applied ones

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
