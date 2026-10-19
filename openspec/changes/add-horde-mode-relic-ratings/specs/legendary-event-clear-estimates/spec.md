## ADDED Requirements

### Requirement: An equipped relic sets the horde-mode multiplier

Wherever a unit's horde-mode multiplier is used (effective power, estimated clears, goals preview, team suggestions, upgrade impact), the multiplier SHALL be the highest `relics[].multiplier` of that character in `horde-mode-tiers` whose `equipmentId` is among the unit's synced `equippedItems`, and otherwise its base multiplier (its own override, else its tier's, else 1.0). This refines the multiplier in "Clear depth is estimated from effective power and battle power". A unit the roster does not hold uses its base multiplier, and its power is 0 regardless.

Assumptions:

- A relic counts at any relic level.
- Goals do not change equipment, so a goals preview uses the synced relic state.

#### Scenario: Worked example, relic equipped

- **GIVEN** `tauCrisis` with base multiplier 1.92 and relic `R_Crit_Dw02AdvancedBurstCannon` at 1.98, and a synced Re'vas with power 20,000 and that relic in `equippedItems`
- **WHEN** her effective power is computed
- **THEN** it is 20,000 × 1.98 = 39,600, and her estimated-clears effective power is 5 × 39,600 = 198,000

#### Scenario: Relic not equipped

- **GIVEN** the same Re'vas at power 20,000 without the relic equipped
- **WHEN** her effective power is computed
- **THEN** it is 20,000 × 1.92 = 38,400
