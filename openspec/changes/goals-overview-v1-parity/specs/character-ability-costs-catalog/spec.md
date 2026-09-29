## Purpose

Provides the per-level gold and ability-badge cost of raising a character's ability from one level to the next, as a game-catalog dataset the goal resource calculation reads, so Character Ability goals can show what they still need.

## ADDED Requirements

### Requirement: The catalog serves a character ability cost ladder

The game catalog SHALL serve a dataset, alongside the existing datasets, that lists for every ability level a character can reach: the level, the gold cost of reaching it, the number of ability badges it costs, and the rarity tier of those badges. The ladder SHALL cover level 2 through the maximum ability level, and its values SHALL match the character ability level-up table shown by V1. The dataset SHALL be versioned and fetched by the client the same way the other catalog datasets are, and an unavailable or invalid dataset SHALL degrade only the Character Ability cost display (no chips for those goals), never the rest of the goals list.

#### Scenario: The client reads the ladder

- **WHEN** the client loads the catalog
- **THEN** it can read, for each ability level from 2 to the maximum, its gold cost, badge count and badge rarity

#### Scenario: The ladder matches V1

- **GIVEN** V1's ability level-up table
- **WHEN** the served ladder is compared with it level by level
- **THEN** gold, badge count and rarity are equal for every level

#### Scenario: The dataset fails to load

- **GIVEN** the character ability cost dataset cannot be loaded
- **WHEN** the Goals list renders a Character Ability goal
- **THEN** the goal renders without ability cost chips, and every other goal renders normally
