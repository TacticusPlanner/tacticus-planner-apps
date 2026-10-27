# quest-event-rewards Specification

## Purpose

Shows what a Quest Event pays: the 17 crates and their rewards, the featured-hero shards earned from medals (with the Quest Bundle), what those shards mean for the hero, and a shortcut to plan them as a goal.

## Requirements

### Requirement: The rewards card lists the crate track

The Quest tab SHALL show a rewards card listing the 17 `quest-crates` records in order, each with its points and its rewards (icon, localized name and amount; an orb or badge with a null `alliance` uses the featured hero's alliance). Crates the current total reaches SHALL be marked opened with accessible text, and the next crate SHALL be highlighted with the points still needed. On desktop it SHALL sit in the right column under the battle detail; on mobile it SHALL follow the summary as a disclosure, collapsed by default.

#### Scenario: Next crate highlighted

- **GIVEN** a total of 2,300, with crate 5 at 2,000 and crate 6 at 2,500
- **THEN** crates 1 to 5 are marked opened and crate 6 shows "200 points to go"

#### Scenario: Crates unavailable

- **GIVEN** `quest-crates` failed to load
- **THEN** the card shows an error with Retry, and the shard section still renders

### Requirement: Featured-hero shards come from medals, tripled by the bundle

Shards **earned** SHALL be the sum of medals over the 17 battles times the multiplier: 1 without the Quest Bundle and 3 with it. The **maximum** SHALL be 51 times the multiplier. The card SHALL show earned, maximum and still reachable (maximum minus earned). The bundle toggle SHALL be stored in the occurrence's progress entry as `bundle` and default to off.

Assumptions:

- 1 shard per medal, and the bundle adds 2 per medal (wiki).

#### Scenario: Bundle on

- **GIVEN** 30 medals entered
- **WHEN** the player turns the bundle on
- **THEN** the card shows "90 earned · 153 max · 63 still reachable"

### Requirement: The card says what the shards mean for the featured hero

When the hero is not owned, the card SHALL compare the player's shards plus the maximum with the unlock cost from `unlock-shard-costs` for the hero's starting rarity, and say "Unlocks Nubari" or "N shards short of unlocking". When the hero is owned, it SHALL walk `ascension-costs` from the hero's current progression and list the steps (stars and ascensions) that the current shards plus the maximum cover, noting that orbs are also needed and not counted. Earned shards SHALL be shown on the same walk as "reached so far". Missing synced data SHALL show the shard numbers only.

#### Scenario: Not owned

- **GIVEN** Nubari is not owned, the player has 12 shards, the unlock costs 40 and the bundle is off
- **THEN** the card says "Unlocks Nubari, with 23 shards to spare" (12 + 51 − 40)

### Requirement: A goal can be created or opened for the featured hero

The card SHALL show "Create goal", which opens the Create goal sheet prefilled with the featured hero and an Unlock goal (not owned) or an Ascension goal to the last step the maximum covers (owned). When the player has an active Unlock or Ascension goal for that hero, the card SHALL show "Open goal" instead, opening it in the Edit goal dialog. In a preview or for a browsed quest the action SHALL still show.

#### Scenario: Existing goal

- **GIVEN** an active Ascension goal for Nubari
- **THEN** the card shows "Open goal", which opens that goal's Edit dialog

### Requirement: Rewards copy is localized

All rewards copy SHALL be localized in en, de, es and fr in the `quest` namespace, and the Quest tour SHALL gain a rewards step on both viewports.

#### Scenario: Tour step

- **WHEN** the tour runs on mobile
- **THEN** the rewards step targets the collapsed rewards disclosure
