import { progressionIndex, type Progression } from "./progression"
import { rankIndex, type Rank } from "./rank"

// The game's own unit power score, ported 1:1 from V1's `calculateRosterCharacterPower` /
// `calculateRosterMowPower` (tacticusplanner/src/fsd/4-entities/unit/character-power/character-power.ts),
// including its truncations, chance stacking, the √0.9 melee range and the passive curve for a MoW's
// secondary ability. The game data comes from the catalog `unit-power` record (`unitPowerTables`) plus
// the unit, equipment and upgrade datasets. V1's loud validation becomes `UnitPowerDataError`: missing
// or out-of-range game data throws it rather than returning a believable-but-wrong number, and app
// adapters turn it into "unavailable".

/** The served `unit-power` record, in the shape the tables are built from. */
export type UnitPowerRecord = {
  heroProgressionSteps: readonly {
    unitStatMultiplierPct: number
    abilityPowerMultiplier: number
  }[]
  mowProgressionSteps: readonly {
    abilityPowerMultiplier: number
    mythicAbilityPower: number
  }[]
  damageProfileModifiers: readonly { damageType: string; modifier: number }[]
  traitPowerModifiers: readonly { traitId: string; modifier: number }[]
  abilityPowerModifiers: readonly { abilityId: string; modifier: number }[]
  abilityPowerCurves: {
    active: readonly number[]
    passive: readonly number[]
    relic: readonly number[]
  }
  units: readonly {
    unitId: string
    powerMultiplier: number
    rankUpStatIncreases: readonly (readonly number[])[]
  }[]
}

/** The `unit-power` record indexed for lookups; build it once with `unitPowerTables`. */
export type UnitPowerTables = {
  heroSteps: UnitPowerRecord["heroProgressionSteps"]
  mowSteps: UnitPowerRecord["mowProgressionSteps"]
  damageProfileModifiers: ReadonlyMap<string, number>
  traitModifiers: ReadonlyMap<string, number>
  abilityModifiers: ReadonlyMap<string, number>
  curves: UnitPowerRecord["abilityPowerCurves"]
  units: ReadonlyMap<string, UnitPowerRecord["units"][number]>
}

/** The game data needed for a power figure is missing or out of range (e.g. a unit, item or upgrade
 * newer than the `unit-power` record). Callers show "unavailable", never a partial figure. */
export class UnitPowerDataError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UnitPowerDataError"
  }
}

/** The stat an upgrade raises, as the catalog `upgrades` dataset names it. */
export type UpgradeStat = "Health" | "Damage" | "Armour"

/** The catalog character fields the formula reads. */
export type PowerCharacter = {
  id: string
  health: number
  damage: number
  armour: number
  movement: number
  traits: readonly string[]
  meleeDamage: string
  meleeHits: number
  rangedDamage?: string | null
  rangedHits?: number | null
  rangeDistance?: number | null
  activeAbilityNames: readonly string[]
  passiveAbilityNames: readonly string[]
  rankUpUpgrades: readonly { upgradeIds: readonly string[] }[]
}

/** The catalog equipment fields the formula reads; an item with an `abilityId` is a relic. */
export type PowerItem = {
  id: string
  abilityId: string
  levels: readonly { stats: Readonly<Record<string, number>> }[]
}

export type CharacterPowerState = {
  rank: Rank
  progression: Progression
  /** Slot indices (0..5) of the current rank's `rankUpUpgrades` row already applied. */
  appliedUpgradeSlots: readonly number[]
  activeAbilityLevel: number
  passiveAbilityLevel: number
  /** Equipped items at their levels (1-based); none for the stats before equipment. */
  items?: readonly { item: PowerItem; level: number }[]
}

export type CharacterStats = { health: number; damage: number; armour: number }

/** The catalog MoW fields the formula reads (its two ability ids; catalog MoWs list no traits). */
export type PowerMow = {
  id: string
  traits?: readonly string[]
  primaryAbility: { name: string }
  secondaryAbility: { name: string }
}

export type MowPowerState = {
  progression: Progression
  primaryAbilityLevel: number
  secondaryAbilityLevel: number
}

/** The catalog NPC fields the formula reads. */
export type PowerNpc = {
  id: string
  movement: number
  traits: readonly string[]
  meleeDamage: string
  meleeHits: number
  rangedDamage?: string | null
  rangedHits?: number | null
  distance?: number | null
  activeAbilities: readonly string[]
  passiveAbilities: readonly string[]
}

/** One catalog NPC `stats` row: final stats, with both abilities at `abilityLevel`. */
export type PowerNpcRow = {
  health: number
  damage: number
  armour: number
  abilityLevel: number
  progressionIndex: number
}

const MELEE_RANGE = 0.9

type FullStats = CharacterStats & {
  critChance: number
  critDamage: number
  blockChance: number
  blockDamage: number
}

type Weapon = { hits: number; damageType: string; range: number }

export function unitPowerTables(record: UnitPowerRecord): UnitPowerTables {
  return {
    heroSteps: record.heroProgressionSteps,
    mowSteps: record.mowProgressionSteps,
    damageProfileModifiers: new Map(
      record.damageProfileModifiers.map((row) => [row.damageType, row.modifier])
    ),
    traitModifiers: new Map(
      record.traitPowerModifiers.map((row) => [row.traitId, row.modifier])
    ),
    abilityModifiers: new Map(
      record.abilityPowerModifiers.map((row) => [row.abilityId, row.modifier])
    ),
    curves: record.abilityPowerCurves,
    units: new Map(record.units.map((unit) => [unit.unitId, unit])),
  }
}

/**
 * A character's Health, Damage and Armour before equipment (V1's stat step): base stats plus every
 * completed rank's upgrade increases, × the progression step's `unitStatMultiplierPct` truncated, plus
 * the applied current-rank slots unscaled. `upgradeStats` maps an upgrade id to the stat it raises.
 */
export function characterStats(
  tables: UnitPowerTables,
  character: PowerCharacter,
  state: CharacterPowerState,
  upgradeStats: ReadonlyMap<string, UpgradeStat>
): CharacterStats {
  const unit = requireUnit(tables, character.id)
  const step = requireStep(
    tables.heroSteps,
    progressionIndex(state.progression),
    character.id
  )
  const rank = rankIndex(state.rank)
  const stats = {
    health: character.health,
    damage: character.damage,
    armour: character.armour,
  }

  for (let completed = 0; completed < rank; completed += 1) {
    const ids = character.rankUpUpgrades[completed]?.upgradeIds
    const increases = unit.rankUpStatIncreases[completed]
    if (!ids || !increases || ids.length !== increases.length) {
      throw new UnitPowerDataError(
        `Invalid upgrade row ${completed} for ${character.id}`
      )
    }
    ids.forEach((id, slot) =>
      addUpgrade(stats, id, increases[slot], upgradeStats, character.id)
    )
  }

  const multiplier = step.unitStatMultiplierPct
  stats.health = Math.trunc((stats.health * multiplier) / 100)
  stats.damage = Math.trunc((stats.damage * multiplier) / 100)
  stats.armour = Math.trunc((stats.armour * multiplier) / 100)

  for (const slot of state.appliedUpgradeSlots) {
    const id = character.rankUpUpgrades[rank]?.upgradeIds[slot]
    const increase = unit.rankUpStatIncreases[rank]?.[slot]
    if (id === undefined || increase === undefined) {
      throw new UnitPowerDataError(
        `Invalid current-rank upgrade ${slot} for ${character.id}`
      )
    }
    addUpgrade(stats, id, increase, upgradeStats, character.id)
  }

  return stats
}

/** A character's in-game power at the given state, items included. */
export function characterPower(
  tables: UnitPowerTables,
  character: PowerCharacter,
  state: CharacterPowerState,
  upgradeStats: ReadonlyMap<string, UpgradeStat>
): number {
  const unit = requireUnit(tables, character.id)
  const step = requireStep(
    tables.heroSteps,
    progressionIndex(state.progression),
    character.id
  )
  const base = characterStats(tables, character, state, upgradeStats)
  const items = state.items ?? []
  const stats = withItems(base, items)
  const relicLevel = items.reduce(
    (level, { item, level: itemLevel }) => (item.abilityId ? itemLevel : level),
    0
  )

  const weapons = weaponsOf(
    character.meleeDamage,
    character.meleeHits,
    character.rangedDamage,
    character.rangedHits,
    character.rangeDistance
  )
  const abilitiesPower =
    (abilityPower(
      tables,
      character.activeAbilityNames[0],
      state.activeAbilityLevel,
      tables.curves.active
    ) +
      abilityPower(
        tables,
        character.passiveAbilityNames[0],
        state.passiveAbilityLevel,
        tables.curves.passive
      )) *
    step.abilityPowerMultiplier

  let relicPower = 0
  if (relicLevel >= 1) {
    const curveValue = tables.curves.relic[relicLevel - 1]
    if (curveValue === undefined) {
      throw new UnitPowerDataError(
        `Relic ability level ${relicLevel} is outside the power curve`
      )
    }
    relicPower = curveValue
  }

  return finalPower(
    tables,
    character.traits,
    (statsPower(tables, stats, weapons) * Math.sqrt(character.movement)) / 100 +
      abilitiesPower +
      relicPower,
    unit.powerMultiplier
  )
}

/** A Machine of War's in-game power: primary (active curve) and secondary (passive curve) ability
 * power plus the step's flat mythic ability power. MoWs have no stats, weapons, items or rank. */
export function mowPower(
  tables: UnitPowerTables,
  mow: PowerMow,
  state: MowPowerState
): number {
  const unit = requireUnit(tables, mow.id)
  const step = requireStep(
    tables.mowSteps,
    progressionIndex(state.progression),
    mow.id
  )
  const abilitiesPower =
    (abilityPower(
      tables,
      mow.primaryAbility.name,
      state.primaryAbilityLevel,
      tables.curves.active
    ) +
      abilityPower(
        tables,
        mow.secondaryAbility.name,
        state.secondaryAbilityLevel,
        tables.curves.passive
      )) *
    step.abilityPowerMultiplier
  return finalPower(
    tables,
    mow.traits ?? [],
    abilitiesPower + step.mythicAbilityPower,
    unit.powerMultiplier
  )
}

/**
 * An NPC's power at one catalog `stats` row, from the character calculation with the row's stats as
 * final stats, no items, crit or block, both abilities at the row's level and `powerMultiplier` 100.
 * An estimate: the catalog lacks some NPCs' crit, block and abilities (mostly bosses).
 */
export function npcPower(
  tables: UnitPowerTables,
  npc: PowerNpc,
  row: PowerNpcRow
): number {
  const step = requireStep(tables.heroSteps, row.progressionIndex, npc.id)
  const stats: FullStats = {
    health: row.health,
    damage: row.damage,
    armour: row.armour,
    critChance: 0,
    critDamage: 0,
    blockChance: 0,
    blockDamage: 0,
  }
  const weapons = weaponsOf(
    npc.meleeDamage,
    npc.meleeHits,
    npc.rangedDamage,
    npc.rangedHits,
    npc.distance
  )
  const abilitiesPower =
    (abilityPower(
      tables,
      npc.activeAbilities[0],
      row.abilityLevel,
      tables.curves.active
    ) +
      abilityPower(
        tables,
        npc.passiveAbilities[0],
        row.abilityLevel,
        tables.curves.passive
      )) *
    step.abilityPowerMultiplier
  return finalPower(
    tables,
    npc.traits,
    (statsPower(tables, stats, weapons) * Math.sqrt(npc.movement)) / 100 +
      abilitiesPower,
    100
  )
}

function finalPower(
  tables: UnitPowerTables,
  traits: readonly string[],
  scaled: number,
  powerMultiplier: number
): number {
  const traitMultiplier = traits.reduce(
    (product, trait) =>
      product * ((tables.traitModifiers.get(trait) ?? 100) / 100),
    1
  )
  return Math.round((10 + traitMultiplier * scaled) * (powerMultiplier / 100))
}

/** `(durability × weaponsPower)^(2/3)`. */
function statsPower(
  tables: UnitPowerTables,
  stats: FullStats,
  weapons: readonly Weapon[]
): number {
  let squaredWeaponPower = 0
  for (const weapon of weapons) {
    const modifier = tables.damageProfileModifiers.get(weapon.damageType)
    if (modifier === undefined) {
      throw new UnitPowerDataError(
        `No damage profile modifier for ${weapon.damageType}`
      )
    }
    const baseDamage = weapon.hits * stats.damage
    const criticalDamage =
      stats.critDamage * geometricPartial(stats.critChance / 100, weapon.hits)
    const weaponPower =
      (baseDamage + criticalDamage) * (modifier / 100) * Math.sqrt(weapon.range)
    squaredWeaponPower += weaponPower * weaponPower
  }
  const weaponsPower = Math.sqrt(squaredWeaponPower)
  const expectedBlock =
    3 * stats.blockDamage * geometricPartial(stats.blockChance / 100, 3)
  const durability = (stats.health + expectedBlock) * (1 + stats.armour / 2)
  return Math.pow(durability * weaponsPower, 2 / 3)
}

/** The melee weapon, and the ranged one when present. A weapon with no damage type deals none. */
function weaponsOf(
  meleeDamage: string,
  meleeHits: number,
  rangedDamage: string | null | undefined,
  rangedHits: number | null | undefined,
  range: number | null | undefined
): Weapon[] {
  const weapons: Weapon[] = []
  if (meleeDamage)
    weapons.push({
      hits: meleeHits,
      damageType: meleeDamage,
      range: MELEE_RANGE,
    })
  if (rangedDamage) {
    weapons.push({
      hits: rangedHits ?? 0,
      damageType: rangedDamage,
      range: range ?? MELEE_RANGE,
    })
  }
  return weapons
}

function abilityPower(
  tables: UnitPowerTables,
  abilityId: string | undefined,
  level: number,
  curve: readonly number[]
): number {
  if (!abilityId || level < 1) return 0
  const base = curve[level - 1]
  if (base === undefined) {
    throw new UnitPowerDataError(
      `Ability level ${level} is outside the power curve`
    )
  }
  return base * ((tables.abilityModifiers.get(abilityId) ?? 100) / 100)
}

/** Adds the item level stats (V1's `calculateItemStats`): chances stack, then bonuses apply. */
function withItems(
  base: CharacterStats,
  items: readonly { item: PowerItem; level: number }[]
): FullStats {
  const total = {
    ...base,
    critChance: 0,
    critDamage: 0,
    blockChance: 0,
    blockDamage: 0,
  }
  const bonus = { critChance: 0, critDamage: 0, blockChance: 0, blockDamage: 0 }
  for (const { item, level } of items) {
    const stats = item.levels[level - 1]?.stats
    if (!stats) {
      throw new UnitPowerDataError(`Item ${item.id} has no level ${level}`)
    }
    total.health += stats.hp ?? 0
    total.damage += stats.damage ?? 0
    total.armour += stats.armor ?? 0
    total.critChance = stackChance(total.critChance, stats.critChance ?? 0)
    total.critDamage += stats.critDamage ?? 0
    total.blockChance = stackChance(total.blockChance, stats.blockChance ?? 0)
    total.blockDamage += stats.blockDamage ?? 0
    bonus.critChance = stackChance(bonus.critChance, stats.critChanceBonus ?? 0)
    bonus.critDamage += stats.critDamageBonus ?? 0
    bonus.blockChance = stackChance(
      bonus.blockChance,
      stats.blockChanceBonus ?? 0
    )
    bonus.blockDamage += stats.blockDamageBonus ?? 0
  }
  if (total.critChance > 0) total.critChance += bonus.critChance
  if (total.critDamage > 0) total.critDamage += bonus.critDamage
  if (total.blockChance > 0) total.blockChance += bonus.blockChance
  if (total.blockDamage > 0) total.blockDamage += bonus.blockDamage
  return total
}

function addUpgrade(
  stats: CharacterStats,
  upgradeId: string,
  increase: number | undefined,
  upgradeStats: ReadonlyMap<string, UpgradeStat>,
  unitId: string
): void {
  if (increase === undefined) {
    throw new UnitPowerDataError(`Missing upgrade stat increase for ${unitId}`)
  }
  switch (upgradeStats.get(upgradeId)) {
    case "Health":
      stats.health += increase
      break
    case "Damage":
      stats.damage += increase
      break
    case "Armour":
      stats.armour += increase
      break
    default:
      throw new UnitPowerDataError(
        `Unsupported upgrade ${upgradeId} for ${unitId}`
      )
  }
}

function requireUnit(tables: UnitPowerTables, unitId: string) {
  const unit = tables.units.get(unitId)
  if (!unit) throw new UnitPowerDataError(`No unit-power entry for ${unitId}`)
  return unit
}

function requireStep<T>(steps: readonly T[], index: number, unitId: string): T {
  const step = steps[index]
  if (step === undefined) {
    throw new UnitPowerDataError(`No progression step ${index} for ${unitId}`)
  }
  return step
}

function stackChance(current: number, added: number): number {
  return current + Math.trunc((1 - current / 100) * added)
}

function geometricPartial(ratio: number, terms: number): number {
  let sum = 0
  let term = ratio
  for (let index = 0; index < terms; index += 1) {
    sum += term
    term *= ratio
  }
  return sum
}
