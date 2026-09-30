## MODIFIED Requirements

### Requirement: Remaining shows one icon chip per resource still needed

For a goal that has not reached its target, the Remaining display SHALL show one chip per resource type still needed, each made of the resource's icon and a quantity, in place of words. Every chip SHALL expose the resource's full localized name and its quantity as a tooltip and as an accessible name. A resource with nothing left to acquire SHALL NOT render a chip. Every chip SHALL render: the display SHALL NOT cap the number of visible chips, collapse any into a "+N" summary, or clip chips by width or height — chips wrap onto further lines within the cell, and the row grows to fit them (see `goal-list-layout`'s row-height exception). Numbers SHALL use the locale's thousands separator. Upgrade materials (crafting ingredients) SHALL NOT be shown as chips for any goal kind. Every chip SHALL use the same icon V1 uses for that resource (energy, gold coin, ability badge, forge badge, Machine of War component, orb, shard, XP book). The chips SHALL be, by goal kind:

- Rank: gold (the gold to apply XP books for a level-up), and energy when a farming energy estimate is available.
- Ascension: orbs by rarity, shards and mythic shards, and energy when estimated.
- Unlock: shards, and energy when estimated.
- Ability on a Machine of War: ability badges by rarity, forge badges by rarity and components, each shown as available/needed (see "Machine of War materials show available/needed"), plus gold, and energy when estimated.
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

#### Scenario: A Machine of War goal with twelve chips shows all twelve

- **GIVEN** a Machine of War Ability goal needing ability badges of five rarities, forge badges of four rarities, components, gold and energy
- **WHEN** its Remaining cell renders on the desktop table
- **THEN** twelve chips are visible, wrapped onto as many lines as needed, with no "+N" chip and nothing cut off

#### Scenario: A chip's name is available without hovering

- **GIVEN** a goal shows an ability-badge chip
- **WHEN** a screen reader reads the chip
- **THEN** it reads the badge's rarity and name and its quantity

#### Scenario: A goal with no remaining resources shows no chips

- **GIVEN** a goal that has not reached its target but has no resource left to acquire
- **WHEN** its Remaining display renders
- **THEN** it shows no chips and no placeholder text
