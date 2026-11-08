## MODIFIED Requirements

### Requirement: Collection sorts units within each faction

The Sort control SHALL offer Rarity (the default), Rank, Abilities, Shards and Power. The selected sort SHALL order owned units within each faction group; every sort SHALL keep owned units before unowned units, keep unowned units nearest to unlock first, and keep the faction group order. Ties under any sort SHALL fall back to the Rarity order (progression descending, then rank descending), then localized name.

- **Rarity:** progression (rarity, then stars) descending, then rank descending.
- **Rank:** rank descending; owned Machines of War, which have no rank, after the owned characters of their group.
- **Abilities:** the sum of the unit's two ability levels (active plus passive for a character, primary plus secondary for a Machine of War) descending.
- **Shards:** owned units at or past one blue star (Legendary one blue star and every Mythic step) first, ordered by mythic shards descending; then the remaining owned units ordered by shards descending.
- **Power:** the unit's in-game power, equipped items included, descending; characters and Machines of War are ordered together. An owned unit whose power cannot be computed (its game data is missing) SHALL follow the owned units whose power is known. While the power data is still loading under this sort, the page SHALL show its loading placeholders rather than the list in another order.

Blackstone value and faction-total sorts SHALL NOT be offered.

#### Scenario: Sort by rank

- **GIVEN** an Ultramarines group where the player owns Titus at Gold 1, Calgar at Diamond 1 and the Ultramarines Machine of War, and does not own one character
- **WHEN** the user selects sort Rank
- **THEN** the group lists Calgar, Titus, the Machine of War, then the unowned character

#### Scenario: Sort by abilities

- **GIVEN** owned units in one faction with active/passive (or primary/secondary) levels 40/38 (sum 78), 50/20 (sum 70) and 45/33 (sum 78), the two 78s at Legendary red four stars and Epic red three stars respectively
- **WHEN** the user selects sort Abilities
- **THEN** the order is the Legendary 78, the Epic 78 (tie broken by progression), then the 70

#### Scenario: Sort by shards across the blue-star boundary

- **GIVEN** owned units in one faction: A at Legendary red five stars with 480 shards, B at Legendary one blue star with 12 mythic shards and 300 shards, C at Mythic two blue stars with 40 mythic shards
- **WHEN** the user selects sort Shards
- **THEN** the order is C (40 mythic), B (12 mythic), A (480 shards), because units at or past one blue star sort by mythic shards ahead of those below it

#### Scenario: Sort by power

- **GIVEN** an Ultramarines group where the player owns Calgar (power 3,400), the Ultramarines Machine of War (power 2,000), Titus (power 1,200) and Tigurius, whose power cannot be computed
- **WHEN** the user selects sort Power
- **THEN** the group lists Calgar, the Machine of War, Titus, then Tigurius, then the unowned units

#### Scenario: Unowned order is fixed

- **GIVEN** a faction with two unowned characters at 300 of 400 and 75 of 400 shards
- **WHEN** the user switches between every sort option
- **THEN** both stay after the owned units, the 300-shard character first
