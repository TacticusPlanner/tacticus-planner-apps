## ADDED Requirements

### Requirement: Ability goals stay available past the rarity cap

The creation form SHALL offer the Ability goal type for an owned unit unless both ability tracks are already at the highest ability level (60). A unit whose tracks are at its current rarity's cap SHALL still be offered Ability, and a target above that cap SHALL get the Ascension prerequisite suggestion.

#### Scenario: Legendary unit at its rarity cap

- **GIVEN** a Legendary unit (ability cap 50) with both abilities at 50
- **WHEN** the owner opens the creation form for it
- **THEN** the Ability goal type is available, and a target of 60 adds the suggested Ascension prerequisite

#### Scenario: Both abilities at the highest level

- **GIVEN** a unit with both abilities at 60
- **THEN** the Ability goal type is unavailable and the form says its abilities have reached the maximum level
