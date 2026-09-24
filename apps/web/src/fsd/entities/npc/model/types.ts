/** One served stat row. Ladders are served in raw order and are not unique on (rank, stars). */
export interface NpcStatRow {
  abilityLevel: number
  damage: number
  armour: number
  health: number
  progressionIndex: number
  rank: number
  stars: number
}

/**
 * Structural shape of a served `npcs` record (the catalog's `NpcStorageModel`), so the entity's pure
 * logic does not depend on the storage package's branded types.
 */
export interface NpcRecord {
  id: string
  name: string
  factionId: string
  alliance: string
  kind: "unit" | "machineOfWar" | "object"
  meleeDamage: string
  meleeHits: number
  rangedDamage: string | null
  rangedHits: number | null
  distance: number | null
  movement: number
  traits: readonly string[]
  activeAbilityDamage: readonly string[]
  activeAbilities: readonly string[]
  passiveAbilityDamage: readonly string[]
  passiveAbilities: readonly string[]
  stats: readonly NpcStatRow[]
}

/** One available variation of an NPC (a served record with a usable ladder). */
export type NpcVariation = NpcRecord

/** One listed NPC: every available variation sharing a catalog name, keyed by a URL-safe slug. */
export interface NpcGroup {
  /** URL-safe slug of `name`; the entity id in `/library/npcs/{id}`. */
  id: string
  /** The catalog name shared by every variation. */
  name: string
  factionId: string
  alliance: string
  /** The variation selected when the URL names none (or an unknown one). */
  defaultVariationId: string
  variations: readonly NpcVariation[]
}

/** One Level selector option, in display order. */
export interface NpcLevelOption {
  /** Index into the variation's served `stats` — the `?level=` value. */
  servedIndex: number
  row: NpcStatRow
  /** True when another row of the same variation shares this rank and stars. */
  tie: boolean
}

/** Melee-only, or carries a ranged weapon. Every unit has a melee attack. */
export type NpcAttackFilter = "meleeOnly" | "ranged"

export interface NpcFilters {
  search: string
  factionId: string | null
  alliance: string | null
  attack: NpcAttackFilter | null
  damageTypes: readonly string[]
  traits: readonly string[]
}
