## REMOVED Requirements

### Requirement: Active-project and active-goal basis

**Reason**: The Arena selector no longer defaults to the active plan; it is an optional filter defaulting to all goals.

**Migration**: See the replacement requirement in this delta.

### Requirement: Arena project selector

**Reason**: The Arena selector no longer defaults to the active plan; it is an optional filter defaulting to all goals.

**Migration**: See the replacement requirement in this delta.

## ADDED Requirements

### Requirement: Selected-project and active-goal basis

The Arena page SHALL provide a project selector whose optional current value is the
"selected project" that narrows the **Plan Team**. "Active goal" SHALL mean a
goal whose status is `Active`. A character SHALL be considered a contributor to
a goal when it is that goal's target character, and a contributor to a project
when it is the target character of any active goal that belongs to that project.
Machines of War SHALL never appear in a recommended team.

While a project is selected, the **Plan Team**'s primary candidate pool SHALL be
that project's owned contributing characters. While none is selected (the
default), it SHALL be the owned contributors to all active goals in global
priority order. Either way it widens as specified in "Minimum team size and
candidate-pool expansion". The Plan Team SHALL always produce a team for a
player with at least three owned characters; it has no "no basis" empty state.
Selected-project contributors SHALL be ranked ahead of characters that
contribute only to active goals outside that project.

Assumptions:

- The project selector is the shared Dailies project selector; its default value
  and cross-tab persistence are specified in "Arena project selector".
- If no project is selected (the default, or because the player has no projects),
  the Plan Team's primary pool is the active-goal contributors, widening to the
  full roster.

#### Scenario: Active Project Team basis

- **WHEN** the selected project P contains active goals targeting owned
  characters A, B, and C (all owned)
- **THEN** the Plan Team is built from candidates {A, B, C} before any pool
  expansion

#### Scenario: Overall Goals Team basis

- **WHEN** the selected project contributes only characters A and B, and the
  player has active goals targeting owned characters C and D in other projects
- **THEN** the Plan Team pool widens to include {C, D}, with A and B ranked
  ahead of C and D

#### Scenario: Switching the selected project re-tunes the Plan Team

- **WHEN** the player changes the project selector from project P to project Q
- **THEN** the Plan Team is rebuilt with project Q's contributing characters as
  its primary pool

#### Scenario: No project selected

- **WHEN** the player has not selected a project
- **THEN** the Plan Team is drawn from the contributors to all active goals, then
  the full roster, rather than a "no project" message

#### Scenario: No active goals

- **WHEN** the player has no goals with status `Active` and no selectable
  project
- **THEN** the Plan Team widens to the full roster and recommends a team drawn
  from it, flagged as broadened, rather than showing a "no active goals" message

### Requirement: Arena project selector defaults to all goals

The Arena page SHALL let the player optionally narrow the Plan Team to one
project, using the shared Dailies project selector. Its initial value SHALL be
"All goals" (no project selected). The selected project SHALL be shared with the
other Dailies sub-tabs that offer the selector for the session — changing it on
the Arena page changes it on Shops, Onslaught, and Salvage Run and vice versa —
and SHALL reset to "All goals" on a full page reload (it is not persisted).

#### Scenario: Default selection is all goals

- **WHEN** the player opens the Arena page with no project chosen this session
- **THEN** the project selector shows "All goals" and the Plan Team draws on every
  active goal

#### Scenario: Selection is shared across Dailies tabs

- **WHEN** the player changes the project on the Arena page and then opens the
  Shops tab
- **THEN** the Shops tab shows the same project selected
