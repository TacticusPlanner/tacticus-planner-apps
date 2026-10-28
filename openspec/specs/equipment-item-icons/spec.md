# equipment-item-icons Specification

## Purpose

Ensures every named catalog equipment item, and every relic ability, shows its icon by catalog id on any host,
including case-sensitive ones, with a defined fallback for items the game ships no asset for.

## Requirements

### Requirement: Item and relic ability icons load by exact catalog id

For every named catalog equipment id (an id whose English name in the `equipmentItems` namespace is a real
name, not the `_<id>` placeholder of the 12 unnamed items), the client SHALL resolve its icon to the pinned game
sprite `game_catalog/datamines/items/ui_icon_item_<id>.webp`, using the game's spelling where it differs only in
letter case (e.g. `R_Block_DaemonfleshPlate` → `R_Block_DaemonFleshPlate`). For every relic's ability id it SHALL
resolve to `game_catalog/datamines/abilities/ui_icon_ability2_<abilityId>.webp`, again using the game's spelling or
folder where it differs (e.g. `DaemonfleshPlate` → `DaemonFleshPlate`). A file with exactly that path, including
letter case, SHALL ship in `apps/web/public`, except for a listed set of known gaps. A known-gap equipment item
SHALL show the unknown-item icon (`game_catalog/datamines/items/ui_icon_item_unknown.webp`).

The known gaps are the equipment items `I_Block_E005` (Master-Crafted Power Field) and
`I_Block_L005` (Artificer Power Field), for which neither V1 nor the game data ships an asset.

#### Scenario: Case-sensitive host

- **GIVEN** the app served from a case-sensitive host
- **WHEN** the client requests the item icons for `R_Block_DaemonfleshPlate` and
  `R_Crit_Dw02AdvancedBurstCannon`, or the ability icons for `DaemonfleshPlate`, `NetherRealmCasket`,
  `Helspear` and `PhasalSubjugator`
- **THEN** each URL it resolves for the id points at a shipped file, not the fallback and not a broken image

#### Scenario: No asset in the game

- **WHEN** a page shows `I_Block_E005`
- **THEN** it shows the unknown-item icon with the item's name

#### Scenario: Equipment icon coverage is tested in CI

- **WHEN** the apps test suite runs
- **THEN** a test takes the named ids from the `equipmentItems` namespace and fails for any id, outside the
  known gaps, whose resolved `ui_icon_item_<id>.webp` is not present with exactly matching case
