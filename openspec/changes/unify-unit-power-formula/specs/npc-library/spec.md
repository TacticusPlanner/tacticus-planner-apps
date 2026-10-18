## ADDED Requirements

### Requirement: The detail view shows the selected level's power

The NPC detail view SHALL show a **Power** stat card next to Health, Armour and Damage. It holds the NPC power (see `unit-power`, "NPC power") of the selected variation's selected level row, and changing the level SHALL update it. The card SHALL carry a short note, revealed on hover, focus or tap, saying the value is estimated from the listed stats and can differ from the game's figure for units with extra abilities, crit or block. While the `unit-power` dataset is loading it SHALL show a placeholder. When the dataset failed to load, the card SHALL show "—" with the text "Power data unavailable", and the other stat cards SHALL be unaffected. Desktop and mobile show the same card in their stat card rows.

#### Scenario: Power follows the selected level

- **WHEN** `darkaNpc1Infiltrator` is selected at its third level row (health 76, damage 34, armour 22)
- **THEN** the Power card shows 45, and choosing another level updates it

#### Scenario: Unit with no attacks

- **WHEN** a variation with no attacks, such as `Watcher`, is selected
- **THEN** the Power card shows round(10 + trait multiplier × ability power) for that row, not an error

#### Scenario: Power data unavailable

- **GIVEN** the `unit-power` dataset failed to load
- **WHEN** an NPC detail renders
- **THEN** the Power card shows "—" and "Power data unavailable", and Health, Armour and Damage show as usual
