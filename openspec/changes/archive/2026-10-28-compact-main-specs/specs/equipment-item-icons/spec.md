## MODIFIED Requirements

### Requirement: Item and relic ability icons load by exact catalog id

For every named catalog equipment id (an id whose English name in the `equipmentItems` namespace is a real
name, not the `_<id>` placeholder of the 12 unnamed items), the client SHALL resolve its icon to
`game_catalog/equipment/ui_icon_item_<id>.png`. For every relic's ability id it SHALL resolve to
`game_catalog/abilities/ui_icon_ability2_<abilityId>.png`. A file with exactly that name, including letter case,
SHALL ship in `apps/web/public`, except for a listed set of known gaps. A known-gap equipment item SHALL show
the existing unknown-item icon.

The known gaps are the equipment items `I_Block_E005` (Master-Crafted Power Field) and
`I_Block_L005` (Artificer Power Field), for which neither V1 nor the game data ships an asset.

#### Scenario: Case-sensitive host

- **GIVEN** the app served from a case-sensitive host
- **WHEN** the client requests the item icons for `R_Block_DaemonfleshPlate` and
  `R_Crit_Dw02AdvancedBurstCannon`, or the ability icons for `DaemonfleshPlate`, `NetherRealmCasket`,
  `Helspear` and `PhasalSubjugator`
- **THEN** each URL it builds from the id resolves to a shipped file, not the fallback and not a broken image

#### Scenario: No asset in the game

- **WHEN** a page shows `I_Block_E005`
- **THEN** it shows the unknown-item icon with the item's name

#### Scenario: Equipment icon coverage is tested in CI

- **WHEN** the apps test suite runs
- **THEN** a test takes the named ids from the `equipmentItems` namespace and fails for any id, outside the
  known gaps, whose `ui_icon_item_<id>.png` is not present with exactly matching case

#### Scenario: Relic ability icon coverage is checked on regeneration

- **WHEN** the ability rules-text generator runs (it reads the catalog's relic ability ids)
- **THEN** it reports and fails for any relic ability id whose `ui_icon_ability2_<abilityId>.png` is not present
  with exactly matching case
