export type UnitStatPair = { current: number; target: number }

export type UnitProfileView = {
  id: string
  name: string
  faction: string
  movement: number
  meleeHits: number
  meleeDamageType: string
  rangedHits?: number
  rangedDamageType?: string
  rangeDistance?: number
  /** Deduped union of melee, ranged, and ability damage types (abilities empty until the server
   *  populates activeAbilityDamage/passiveAbilityDamage). */
  damageTypes: string[]
  equipmentSlots: string[]
  traits: string[]
  health: UnitStatPair
  damage: UnitStatPair
  armour: UnitStatPair
}
