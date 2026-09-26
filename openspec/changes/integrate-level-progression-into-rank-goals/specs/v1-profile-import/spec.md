## MODIFIED Requirements

### Requirement: Automatic prerequisite creation is always enabled

The import SHALL always request automatic prerequisite creation, matching the
manual create-goal flow's own default. The automatic prerequisites are Unlock and
Ascension goals only; a Level goal is never created, since the level a Rank or
Ability goal needs is shown on that goal (see `rank-level-progression`). There SHALL NOT be a part-selection
control to disable it — offering one that quietly leaves imported goals
blocked on a prerequisite the user didn't realize they'd opted out of was
worse than not offering the choice at all.

#### Scenario: A missing prerequisite is added without being asked for

- **GIVEN** an imported goal needs an Unlock or Ascension goal that
  does not yet exist
- **WHEN** the import runs
- **THEN** the prerequisite goal is created and reported as an automatically
  added outcome, with no user selection involved

#### Scenario: No Level prerequisite is created

- **GIVEN** an imported Rank goal whose character is below the level its target needs
- **WHEN** the import runs
- **THEN** no Level goal is created for it and the Rank goal shows its required level as ordinary progress
