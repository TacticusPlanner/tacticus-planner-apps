import type {
  CharacterStorageModel,
  EquipmentStorageModel,
  MowStorageModel,
  NpcStorageModel,
  UnitPowerStorageModel,
  UpgradeStorageModel,
} from "@workspace/game-catalog"
import {
  unitPowerTables,
  type PowerCharacter,
  type PowerItem,
  type PowerMow,
  type PowerNpc,
  type UnitPowerTables,
  type UpgradeStat,
} from "@workspace/game-domain"

/** Everything the power formula reads, indexed once from the catalog datasets. */
export type UnitPowerContext = {
  tables: UnitPowerTables
  characters: ReadonlyMap<string, PowerCharacter>
  mows: ReadonlyMap<string, PowerMow>
  npcs: ReadonlyMap<string, PowerNpc>
  items: ReadonlyMap<string, PowerItem>
  upgradeStats: ReadonlyMap<string, UpgradeStat>
}

export type UnitPowerCatalog = {
  unitPower: UnitPowerStorageModel | null
  characters: readonly CharacterStorageModel[]
  mows: readonly MowStorageModel[]
  npcs: readonly NpcStorageModel[]
  equipment: readonly EquipmentStorageModel[]
  upgrades: readonly UpgradeStorageModel[]
}

const upgradeStats: readonly string[] = ["Health", "Damage", "Armour"]

/** The context from the catalog datasets; null when the `unit-power` record is absent. */
export function buildUnitPowerContext(
  catalog: UnitPowerCatalog
): UnitPowerContext | null {
  if (!catalog.unitPower) return null
  return {
    tables: unitPowerTables(catalog.unitPower),
    characters: new Map(catalog.characters.map((unit) => [unit.id, unit])),
    mows: new Map(catalog.mows.map((unit) => [unit.id, unit])),
    npcs: new Map(catalog.npcs.map((unit) => [unit.id, unit])),
    items: new Map(catalog.equipment.map((item) => [item.id, item])),
    upgradeStats: new Map(
      catalog.upgrades.flatMap((upgrade) =>
        upgradeStats.includes(upgrade.stat)
          ? [[upgrade.id, upgrade.stat as UpgradeStat] as const]
          : []
      )
    ),
  }
}
