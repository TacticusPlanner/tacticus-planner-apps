## MODIFIED Requirements

### Requirement: The Edit goal dialog contains only editable fields

The Edit goal dialog SHALL show the goal's unit and kind as read-only text (the goal type SHALL NOT be changeable), followed by only these editable fields: the goal target (for kinds that have one, per `goal-target-editing`), the goal's priority, notes, project memberships, and the farming preferences that apply to the goal's kind (rank farming strategy; Unlock/Ascension acquisition sources per `goal-acquisition-source-picker`; farming locations for the remaining kinds; and, for Character Rank, Upgrade, and Machine-of-War Ability goals whose target needs a Mythic upgrade material, the Mythic materials control per `goal-mythic-material-sources`). It SHALL NOT show history, dependencies or prerequisites, blockers, an estimate, progress, remaining resources, or farming guidance. An Unlock goal, which has no editable target, SHALL show no target section.

#### Scenario: Rank goal

- **WHEN** the dialog opens for an Active Rank goal whose target needs no Mythic material
- **THEN** it shows the unit and "Rank" read-only, then the target, priority, notes, projects, and farming strategy, and no history, dependencies, blockers, estimate, progress, or guidance

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
- **THEN** it shows no target section and shows priority, notes, projects, and acquisition sources
