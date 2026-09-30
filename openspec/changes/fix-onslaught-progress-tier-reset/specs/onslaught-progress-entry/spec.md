## Purpose

Lets a signed-in player record each alliance's current Onslaught position (sector and tier) on `/progress/onslaught`, which the game API does not sync, so shard estimates use the right position.

## ADDED Requirements

### Requirement: Changing sector resets the tier

When the user changes an alliance's Sector, the Tier SHALL be set from the direction of the change: moving to a later sector in the order Stone, Iron, Bronze, Silver, Gold, Diamond, Adamantine sets the Tier to 1; moving to an earlier sector sets the Tier to 4 (sector complete). Re-selecting the current sector SHALL leave the Tier unchanged. The user MAY change the Tier afterwards, and no change is persisted until Save.

#### Scenario: Moving up a sector

- **WHEN** an alliance is at Gold, Tier 4 and the user selects Diamond
- **THEN** the Tier control shows 1 and the draft position is Diamond 1

#### Scenario: Moving down a sector

- **WHEN** an alliance is at Diamond, Tier 1 and the user selects Gold
- **THEN** the Tier control shows the sector-complete option and the draft position is Gold 4

#### Scenario: Same sector

- **WHEN** an alliance is at Silver, Tier 2 and the user selects Silver again
- **THEN** the Tier stays 2
