## Purpose

Defines the icon chips the Goals list's Remaining column shows for what a goal still needs, so a player can read the cost of every goal kind at a glance instead of parsing prose.

## ADDED Requirements

### Requirement: Remaining shows one icon chip per resource still needed

For a goal that has not reached its target, the Remaining display SHALL show one chip per resource type still needed, each made of the resource's icon and a quantity, in place of words. Every chip SHALL expose the resource's full localized name and its quantity as a tooltip and as an accessible name. A resource with nothing left to acquire SHALL NOT render a chip. Numbers SHALL use the locale's thousands separator. Upgrade materials (crafting ingredients) SHALL NOT be shown as chips for any goal kind. Every chip SHALL use the same icon V1 uses for that resource (energy, gold coin, ability badge, forge badge, Machine of War component, orb, shard, XP book). The chips SHALL be, by goal kind:

- Rank: gold (the gold to apply XP books for a level-up), and energy when a farming energy estimate is available.
- Ascension: orbs by rarity, shards and mythic shards, and energy when estimated.
- Unlock: shards, and energy when estimated.
- Ability on a Machine of War: ability badges by rarity, forge badges by rarity, components, gold, and energy when estimated.
- Ability on a Character: ability badges by rarity, gold, and energy when estimated.
- Upgrade: energy when estimated.

#### Scenario: A Rank goal shows materials and energy chips

- **GIVEN** a Rank goal with remaining upgrade materials and a farming estimate of 1,674 energy
- **WHEN** its Remaining display renders
- **THEN** it shows an energy chip reading 1,674 and no upgrade-material chip

#### Scenario: A Machine of War ability goal shows its materials

- **GIVEN** a Machine of War Ability goal with badges, forge badges, components and gold still needed
- **WHEN** its Remaining display renders
- **THEN** it shows those chips (net of inventory) and its energy

#### Scenario: A chip's name is available without hovering

- **GIVEN** a goal shows an ability-badge chip
- **WHEN** a screen reader reads the chip
- **THEN** it reads the badge's rarity and name and its quantity

#### Scenario: A goal with no remaining resources shows no chips

- **GIVEN** a goal that has not reached its target but has no resource left to acquire
- **WHEN** its Remaining display renders
- **THEN** it shows no chips and no placeholder text

### Requirement: A goal partly covered by a higher-priority goal shows its standalone figures

When a Rank goal's need is reduced because a higher-priority goal for the same unit already covers part of the same rank range (the plan allocates overlapping progression once), its Remaining display SHALL expose the goal's standalone figures, what the goal would cost if it were the only goal, as a tooltip on the goal's energy chip (or on the Remaining cell when there is no energy chip): the standalone upgrade-slot count and standalone energy, labelled as standalone. The chips themselves SHALL keep showing the plan-aware (marginal) figures. A goal with no overlap SHALL show no such tooltip content.

#### Scenario: A lower-priority goal covered in part

- **GIVEN** a Rank goal from Silver1 to Gold2 and a higher-priority goal from Silver1 to Gold1 for the same unit
- **WHEN** the lower-priority goal's Remaining display is hovered
- **THEN** the chips show its marginal energy, and the tooltip also shows its standalone slots and standalone energy

#### Scenario: A goal without overlap

- **GIVEN** a Rank goal with no overlapping goal for its unit
- **WHEN** its Remaining display is hovered
- **THEN** no standalone figures are shown

### Requirement: Gold is shown in thousands

A gold chip SHALL display its quantity shortened to thousands with a "k" suffix, as V1 does: a value below 1,000 is shown as is, and a value of 1,000 or more is divided by 1,000, rounded down, and suffixed with "k". The chip's tooltip and accessible name SHALL still carry the full, unabbreviated quantity with the locale's thousands separator. No other chip abbreviates its quantity.

#### Scenario: Large gold values

- **GIVEN** a goal needs 42,235 gold
- **WHEN** its gold chip renders
- **THEN** it reads "42k", and its tooltip and accessible name read 42,235

#### Scenario: Rounding down

- **GIVEN** a goal needs 1,999 gold
- **WHEN** its gold chip renders
- **THEN** it reads "1k"

#### Scenario: Small gold values

- **GIVEN** a goal needs 750 gold
- **WHEN** its gold chip renders
- **THEN** it reads "750"

### Requirement: Remaining shows the projected Onslaught tokens a goal will use

When a goal's estimate obtains part of its need from a selected Onslaught source, the Remaining display SHALL include an Onslaught-token chip showing the projected number of Onslaught tokens (runs) the goal will use, as V1 shows next to its energy, using V1's token icon. Energy chips SHALL cover only the campaign-farmed portion of the goal. A goal with no Onslaught source selected SHALL show no token chip. The figure SHALL come from the same estimate the plan uses (the Onslaught contribution already attributed per source), never a separate calculation.

#### Scenario: An Onslaught-only goal

- **GIVEN** an Ascension goal whose shards come only from Onslaught, projected to use 30 tokens
- **WHEN** its Remaining display renders
- **THEN** it shows a token chip reading 30, and no energy chip

#### Scenario: A mixed goal

- **GIVEN** a goal with campaign farming and an Onslaught source using 12 tokens and 400 energy
- **WHEN** its Remaining display renders
- **THEN** it shows an energy chip reading 400 and a token chip reading 12

#### Scenario: No Onslaught source

- **GIVEN** a goal with no Onslaught source selected
- **WHEN** its Remaining display renders
- **THEN** no token chip is shown

### Requirement: Owned inventory is subtracted in priority order

A chip's quantity SHALL be what the goal still needs after the player's full inventory of that resource has been applied to goals in global priority order, the same shared-pool model the XP-book figure uses: a higher-priority goal consumes the owned stock first, and a lower-priority goal only sees what is left. This applies to ability badges, forge badges, Machine of War components, ascension orbs, and shards. A resource whose need is fully covered by the stock available to the goal SHALL show no chip. Gold SHALL NOT be netted against inventory (V1 parity). A goal that is paused is not part of the allocation and shows its standalone need.

#### Scenario: Fully held resource shows no chip

- **GIVEN** a Machine of War Ability goal needs 27 Legendary ability badges and the player holds 27 that no higher-priority goal claims
- **WHEN** its Remaining display renders
- **THEN** no Legendary ability-badge chip is shown

#### Scenario: Partially held resource shows the shortfall

- **GIVEN** a Machine of War Ability goal needs 138 components and the player holds 118 that no higher-priority goal claims
- **WHEN** its Remaining display renders
- **THEN** the components chip reads 20

#### Scenario: Higher priority consumes stock first

- **GIVEN** two goals both need Legendary ability badges, the player holds 30, and the first needs 27
- **WHEN** both render
- **THEN** the higher-priority goal shows no badge chip and the lower-priority goal shows its need minus 3

#### Scenario: Orbs are netted

- **GIVEN** an Ascension goal needs 10 orbs and the player holds 10
- **WHEN** its Remaining display renders
- **THEN** no orb chip is shown

### Requirement: The XP-book figure sits with the level progress, not in Remaining

When a Character's Rank or Ability goal needs a level-up, the XP-book figure (the XP-book icon in the user's selected XP-book rarity, the goal's needed book count and, next to it, the available count from the shared owned-book pool at this goal's turn in priority order, per `goal-farming-guidance`) SHALL be shown on the goal's combined level line in the Progress cell (see `goal-list-layout`'s level-requirement requirement), and SHALL NOT appear in the Remaining display. The figure SHALL NOT show a raw XP amount. When the goal needs no level-up, or its need rounds to zero books, no book figure SHALL render. A Machine of War goal never shows one.

#### Scenario: A goal needing a level-up

- **GIVEN** a Rank goal whose character is below the required level, with 6 books needed and 4 available in the selected rarity
- **WHEN** the goal's row renders
- **THEN** the level line in the Progress cell shows the level target and a book figure reading 4 available of 6 needed, and the Remaining cell has no book chip

#### Scenario: A goal with no level-up

- **GIVEN** a goal whose character already meets the required level
- **WHEN** its row renders
- **THEN** no book figure and no level line appear

#### Scenario: A Machine of War goal

- **GIVEN** a Machine of War Ability goal
- **WHEN** its row renders
- **THEN** no book figure appears

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
