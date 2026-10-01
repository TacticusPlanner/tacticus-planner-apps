## ADDED Requirements

### Requirement: Remaining shows the shop currency still to spend

In addition to the chips listed by goal kind, a goal with at least one selected shop offer SHALL show one chip per shop currency (for example Guild War Coins), made of the currency's icon and the amount still to be spent. The amount SHALL be the currency cost of the shards the plan attributes to the goal's selected shop offers from now on — the expected purchases of those shards times each offer's cost — so shards the player already owns, and shards supplied by campaigns or Onslaught, are not included. The chip SHALL follow the same rules as every other chip: full localized currency name and quantity as tooltip and accessible name, locale thousands separator, no cap, wrapping, and no chip when the amount is zero. A goal with no selected shop offer, or whose shop shards are already covered, SHALL NOT show the chip. The currency SHALL NOT affect any other chip or any estimate.

#### Scenario: Shop-only Unlock goal shows its coins

- **GIVEN** an Unlock goal needing 500 shards with 0 owned, selecting a war-shop offer of 5 shards per purchase at 900 Guild War Coins each
- **WHEN** its Remaining display renders
- **THEN** it shows a shard chip of 500 and a Guild War Coins chip of 90,000

#### Scenario: Owned shards are not priced

- **GIVEN** the same goal with 100 shards already owned
- **WHEN** its Remaining display renders
- **THEN** the Guild War Coins chip reads 72,000

#### Scenario: Mixed sources price only the shop share

- **GIVEN** a goal whose plan attributes 300 shards to a selected shop offer and the rest to campaign nodes
- **WHEN** its Remaining display renders
- **THEN** the currency chip prices only the 300 shop shards

#### Scenario: Campaign-only goal shows no currency chip

- **GIVEN** a goal with no selected shop offer
- **WHEN** its Remaining display renders
- **THEN** no shop-currency chip is shown
