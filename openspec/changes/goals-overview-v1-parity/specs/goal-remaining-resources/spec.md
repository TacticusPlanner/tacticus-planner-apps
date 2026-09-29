## Purpose

Defines the icon chips the Goals list's Remaining column shows for what a goal still needs, so a player can read the cost of every goal kind at a glance instead of parsing prose.

## ADDED Requirements

### Requirement: Remaining shows one icon chip per resource still needed

For a goal that has not reached its target, the Remaining display SHALL show one chip per resource type still needed, each made of the resource's icon and a quantity, in place of words. Every chip SHALL expose the resource's full localized name and its quantity as a tooltip and as an accessible name. A resource with nothing left to acquire SHALL NOT render a chip. Numbers SHALL use the locale's thousands separator. Upgrade materials (crafting ingredients) SHALL NOT be shown as chips for any goal kind. The chips SHALL be, by goal kind:

- Rank: energy when a farming energy estimate is available, and an XP-book chip when the goal needs a level-up.
- Ascension: orbs by rarity, shards and mythic shards, and energy when estimated.
- Unlock: shards, and energy when estimated.
- Ability on a Machine of War: ability badges by rarity, forge badges by rarity, components, gold. A Machine of War has no character level, so it never shows an XP-book chip.
- Ability on a Character: ability badges by rarity and gold, and an XP-book chip when a level-up is needed.
- Upgrade: energy when estimated.

#### Scenario: A Rank goal shows materials and energy chips

- **GIVEN** a Rank goal with remaining upgrade materials and a farming estimate of 1,674 energy
- **WHEN** its Remaining display renders
- **THEN** it shows an energy chip reading 1,674 and no upgrade-material chip

#### Scenario: A Machine of War ability goal shows no XP-book chip

- **GIVEN** a Machine of War Ability goal with badges, forge badges, components and gold still needed
- **WHEN** its Remaining display renders
- **THEN** it shows those four chips and no XP-book chip

#### Scenario: A chip's name is available without hovering

- **GIVEN** a goal shows an ability-badge chip
- **WHEN** a screen reader reads the chip
- **THEN** it reads the badge's rarity and name and its quantity

#### Scenario: A goal with no remaining resources shows no chips

- **GIVEN** a goal that has not reached its target but has no resource left to acquire
- **WHEN** its Remaining display renders
- **THEN** it shows no chips and no placeholder text

### Requirement: The XP-book chip re-presents the available/needed book figure

When a Character's Rank or Ability goal needs a level-up, the Remaining display SHALL include a chip with the XP-book icon in the user's selected XP-book rarity showing the goal's needed book count and, next to it, the available count from the shared owned-book pool at this goal's turn in priority order, using the same figures defined by `goal-farming-guidance`. The chip SHALL NOT show a raw XP figure. When the goal needs no level-up, or its need rounds to zero books, the chip SHALL NOT render.

#### Scenario: A goal needing a level-up

- **GIVEN** a Rank goal whose character is below the required level, with 6 books needed and 4 available in the selected rarity
- **WHEN** its Remaining display renders
- **THEN** it shows an XP-book chip reading 4 available of 6 needed, and no XP figure

#### Scenario: A goal with no level-up

- **GIVEN** a goal whose character already meets the required level
- **WHEN** its Remaining display renders
- **THEN** no XP-book chip appears

### Requirement: Remaining resources come from the same calculation the plan uses

Each chip's quantity SHALL derive from the goal's resource need computed by the goal-farming calculation, net of what the player already holds and of what a higher-priority goal for the same unit already covers, so a chip never contradicts the plan's estimates. Ability goals for a Machine of War SHALL sum gold, ability badges, forge badges and components per level from the Machine of War upgrade-cost ladder over the goal's ability-level ranges; Ability goals for a Character SHALL sum gold and ability badges per level from `character-ability-costs-catalog`. Badges SHALL be broken down by rarity and, where the alliance of the unit determines the badge, by that alliance.

#### Scenario: Machine of War ability goal sums the cost ladder

- **GIVEN** a Machine of War Ability goal raising its active ability from level 3 to 5
- **WHEN** its resource need is computed
- **THEN** the gold, ability badges, forge badges and components equal the sum of the cost ladder's entries for levels 4 and 5

#### Scenario: Character ability goal sums the character ladder

- **GIVEN** a Character Ability goal raising one ability from level 8 to 10
- **WHEN** its resource need is computed
- **THEN** the gold and ability badges equal the sum of the character cost ladder's entries for levels 9 and 10

#### Scenario: Level range already covered

- **GIVEN** a higher-priority Ability goal for the same unit already covers levels 4 to 5 of an ability
- **WHEN** the lower-priority goal's need for the same levels is computed
- **THEN** those levels contribute nothing, and the goal shows no chip for them
