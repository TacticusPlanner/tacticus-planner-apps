# datamined-game-art Specification

## Purpose

Defines where the app shows the game's own art for event resources, chests, menus, shops and rewards instead of generic icons or plain text.

## Requirements

### Requirement: Event resources show the game's icons

The Legendary Event, Hero Release Event, Home Screen Event and Quest Event pages SHALL show each event resource (points, tokens, shards, currency, chests) with the game's sprite for it. A Hero Release Event SHALL show its featured faction's currency and chest where the game ships one, else the generic event chest. A Home Screen Event SHALL show its own points icon where the game ships one, else the generic event points icon.

#### Scenario: Hero Release Event for a faction with its own currency

- **WHEN** a user opens a Hero Release Event whose featured hero is an Ork
- **THEN** the pace card shows the Orks event currency and the Orks event chest

#### Scenario: Home Screen Event milestone without reward art

- **WHEN** a milestone reward has no known icon
- **THEN** the milestone shows the game's wooden chest instead of a generic gift icon

### Requirement: Rewards resolve to the game's drop-table art

The shop and Home Screen Event reward display SHALL resolve alliance item crates, alliance ability badges and orbs, faction and alliance shard pools, equipment pools, seasonal event currencies, crusade resources, intel, energy, MoW ammo and summoning tokens to the game's own sprite. A seasonal currency with no dedicated art SHALL use the generic event currency.

#### Scenario: Faction shard pool

- **WHEN** a reward is `ShardsOrks`
- **THEN** it shows the game's Orks hero shard pool icon

### Requirement: Generic glyphs use the game's art

Locked units, NPC power, random shop slots, raid tickets, shops, navigation sections and goal types SHALL show the game's own glyph (lock, power fist, die, raid ticket, shop glyph, menu art, upgrade glyph or drop-table art) instead of a generic icon. Every such image SHALL be a pinned game sprite listed in `datamine/sprites.txt`.

#### Scenario: Locked unit in a picker

- **WHEN** a unit the user does not own appears in a unit picker
- **THEN** it carries the game's padlock icon

### Requirement: Raid boss chests show their tier

The raid boss season view SHALL show each set's reward chest as the game's chest art for its tier with the tier's localized name, and SHALL fall back to the chest id for an id it does not recognise.

#### Scenario: Legendary boss set

- **WHEN** a set's chest is `chest_guildboss_defeated_2_legendary`
- **THEN** the set shows the diamond chest icon and "Chest: Diamond"
