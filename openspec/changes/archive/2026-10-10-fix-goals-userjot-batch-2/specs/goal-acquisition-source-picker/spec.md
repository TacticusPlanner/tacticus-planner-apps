## ADDED Requirements

### Requirement: The Edit goal dialog shows the Onslaught yield from saved progress

When the Edit goal dialog or sheet offers the Onslaught source group for a Character Ascension goal, the group SHALL show the same shards/day yield as goal creation. The yield comes from the player's saved Onslaught progress for the unit's alliance and the character's current progression. When the unit isn't in the synced roster, the goal's saved start progression SHALL be used instead. The dialog SHALL prompt the player to set Onslaught progress only when none is saved.

#### Scenario: Saved progress in the Edit dialog

- **WHEN** the player has saved Onslaught progress and opens the Edit goal dialog for a Character Ascension goal
- **THEN** the Onslaught group shows the estimated shards per day and does not prompt the player to set progress

#### Scenario: No saved progress in the Edit dialog

- **WHEN** the player has no saved Onslaught progress and opens the Edit goal dialog for a Character Ascension goal
- **THEN** the Onslaught group prompts the player to set progress via the linked Onslaught progress page, with no shards/day figure
