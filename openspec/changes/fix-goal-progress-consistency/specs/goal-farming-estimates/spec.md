## ADDED Requirements

### Requirement: Resource need for an already-attained goal target is zero

Once the player's synced state already satisfies a goal's configured target, that goal's derived resource need SHALL be zero, regardless of any inventory amount that would otherwise be netted against a nonzero catalog cost. This applies starting with the Unlock goal type, whose resource need previously ignored whether the character was already owned and derived a need from shard inventory alone.

Assumptions:

- Unlock shard catalog cost is keyed by the character's initial rarity.
- "Already owned" for an Unlock goal means the character is present in the player's synced roster.

#### Scenario: Character is already unlocked

- **GIVEN** an Unlock goal for a character whose initial rarity carries a catalog cost of 40 unlock shards, the player owns 5 shards of that resource in inventory, and the character is already present in the player's owned roster
- **WHEN** the goal's resource need is derived
- **THEN** the derived shard need is 0, not the 35 shards that netting 40 against 5 owned would otherwise produce

#### Scenario: Character is not yet unlocked

- **GIVEN** the same Unlock goal, the same 40-shard catalog cost, and the same 5 owned shards, but the character is not present in the player's owned roster
- **WHEN** the goal's resource need is derived
- **THEN** the derived shard need is 35 (40 required minus 5 owned), unchanged from today
