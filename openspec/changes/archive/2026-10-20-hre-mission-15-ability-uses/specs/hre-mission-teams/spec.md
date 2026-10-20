## ADDED Requirements

### Requirement: Any-unit ability uses get Arena and Onslaught teams

When the current mission has no open lineup-restricted objective but has an open ability-use objective for any units (mission 15), the HRE tab SHALL suggest an Arena team of the player's 5 strongest units while the mission's Arena battles are open, and an Onslaught pool of 8 kept to one alliance track, each in its own card. Each card SHALL say that every ability use counts, and SHALL keep the tokens a later mission needs, as other team cards do.

#### Scenario: Mission 15 with Arena battles open

- **GIVEN** mission 15 with 0 of 4 Arena battles and 0 of 150 ability uses
- **THEN** an Arena team card and an Onslaught team card are shown

#### Scenario: Arena battles done

- **GIVEN** mission 15 with 4 of 4 Arena battles and ability uses still open
- **THEN** only the Onslaught team card is shown
