import type {
  EquipmentId,
  Progression,
  Rank,
  Rarity,
  UnitId,
} from "@workspace/game-domain"

export type UnitKind = "character" | "mow"

export interface UnitTileEquipment {
  equipmentId: EquipmentId
  /** Absent when the catalog does not know the item; the tile then draws no rarity frame. */
  rarity?: Rarity
  level: number
}

/** A unit in the player's synced roster, with everything its tile shows. */
export interface OwnedUnitTileData {
  state: "owned"
  progression: Progression
  /** Characters only; Machines of War have no rank. */
  rank?: Rank
  /** Characters only; Machines of War have no XP level shown. */
  xpLevel?: number
  /** Active then passive (characters), or primary then secondary (Machines of War). */
  abilityLevels: [number, number]
  /** Characters only. */
  equipment?: UnitTileEquipment[]
  shards: number
  mythicShards: number
}

/** A catalog unit the player does not own, or whose ownership is not known (no synced roster). */
export interface UnownedUnitTileData {
  state: "unowned"
  /** The frame colour; absent for a Machine of War, whose catalog has no initial rarity. */
  rarity?: Rarity
  /** Absent when the player's shard inventory is not available - the tile then shows no count. */
  shards?: number
  mythicShards?: number
  /** Shards needed to unlock; absent when the catalog defines no unlock cost (Machines of War). */
  unlockShards?: number
}

type UnitTileData = OwnedUnitTileData | UnownedUnitTileData

export interface UnitTileUnit {
  kind: UnitKind
  unitId: UnitId
  /** Localized display name, shown on the tile and leading its accessible name. */
  name: string
  data: UnitTileData
}
