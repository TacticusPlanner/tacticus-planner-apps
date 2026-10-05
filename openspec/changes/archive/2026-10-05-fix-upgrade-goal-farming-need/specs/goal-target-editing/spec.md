## ADDED Requirements

### Requirement: The Upgrade target section edits the range

For an Active or Paused Upgrade goal the Edit goal dialog SHALL prefill the stored range (rank
range for a Character; per-track ranges for a Machine of War) and allow changing or clearing it,
validated like creation (end above start, within the ladder). Saving sends the range together with
the targets as one replacement. A goal stored without a range SHALL show the selectors unset.

#### Scenario: Range is prefilled

- **WHEN** an owner opens the dialog for an Upgrade goal stored with rank range Stone2→Stone4
- **THEN** the target section shows Stone2→Stone4

#### Scenario: Clearing the range

- **WHEN** the owner clears the range and saves
- **THEN** the goal is stored without a range and planning treats it as additive

#### Scenario: Planning reflects the new range

- **WHEN** the owner saves a different range
- **THEN** Today, the Schedule and Remaining recalculate the overlap with the new range
