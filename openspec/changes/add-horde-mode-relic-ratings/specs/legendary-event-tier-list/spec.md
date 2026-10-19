## ADDED Requirements

### Requirement: Tier List shows relic ratings

A tile whose character has `relics` in `horde-mode-tiers` SHALL carry a relic mark with an accessible label. The tile's multiplier and its order in the row SHALL stay the base ones. The tile details SHALL list each relic with its localized name, its multiplier and, when the roster is synced, whether the user has it equipped on that character.

#### Scenario: Relic details

- **GIVEN** `tauCrisis` at 1.92 with `R_Crit_Dw02AdvancedBurstCannon` at 1.98, and the user's synced Re'vas has it equipped
- **WHEN** the user opens Re'vas's tile
- **THEN** the tile reads 1.92× with a relic mark, and the details list "DW-02 Advanced Burst Cannon · 1.98×" marked as equipped

#### Scenario: Roster unknown

- **GIVEN** no synced roster
- **WHEN** the user opens Re'vas's details
- **THEN** the relic row shows its name and 1.98× with no equipped state
