import type { PierceRatios } from "./pierce-ratios"

/**
 * V1's "Stat percentiles" radar (`3-features/character-details/unit-stat-radar.utils.ts`), unchanged:
 * six axes, every character evaluated at one fixed reference (Mythic Wings, Adamantine II), and the
 * share of characters strictly below.
 *
 * The reference stats use V1's own formula and rounding (`calculateStat`), not V2's `statAtRank`.
 * Both scale every character by the same factor, but V1 rounds the reference damage before
 * multiplying by hits; with V2's floor, close products order differently and a few percentiles move.
 * Keeping V1's rounding keeps the numbers V1 players know.
 */
const radarAxes = [
  "health",
  "armour",
  "meleeVsInfiniteArmour",
  "meleeVsZeroArmour",
  "rangedVsInfiniteArmour",
  "rangedVsZeroArmour",
] as const

export type RadarAxis = (typeof radarAxes)[number]

export type RadarAxisResult = {
  axis: RadarAxis
  /** The raw value at the reference (Mythic Wings, Adamantine II). */
  value: number
  /** 0–100: the share of all characters whose value is strictly lower. */
  percentile: number
}

/** The catalog fields the radar reads. */
export type RadarCharacter = {
  id: string
  health: number
  damage: number
  armour: number
  meleeDamage: string
  meleeHits: number
  rangedDamage: string | null
  rangedHits: number | null
}

// V1 `calculateStat` at Adamantine II and Mythic Wings: rank factor 1.252^17 (Diamond III) plus a
// linear 5 per rank past it, times the star factor 1 + 0.1 × 14.
const referenceFactor = (1.252 ** 17 + 5 * 2) * (1 + 0.1 * 14)

const atReference = (base: number) => Math.round(base * referenceFactor)

function axisValues(
  character: RadarCharacter,
  pierceRatios: PierceRatios
): Record<RadarAxis, number> {
  const damage = atReference(character.damage)
  const meleeHits = character.meleeHits
  const rangedHits = character.rangedDamage ? (character.rangedHits ?? 0) : 0
  // An unknown damage type pierces nothing, as in V1.
  const meleePierce = pierceRatios.get(character.meleeDamage) ?? 0
  const rangedPierce = character.rangedDamage
    ? (pierceRatios.get(character.rangedDamage) ?? 0)
    : 0

  return {
    health: atReference(character.health),
    armour: atReference(character.armour),
    meleeVsInfiniteArmour: damage * meleeHits * meleePierce,
    meleeVsZeroArmour: damage * meleeHits,
    rangedVsInfiniteArmour: damage * rangedHits * rangedPierce,
    rangedVsZeroArmour: damage * rangedHits,
  }
}

/** Ties don't count as lower, so a value every melee-only unit shares (0 ranged) reads 0%. */
function percentileOf(value: number, population: readonly number[]): number {
  if (population.length === 0) return 0
  return (
    (population.filter((candidate) => candidate < value).length /
      population.length) *
    100
  )
}

/** Each axis's population, computed once per catalog. */
export function buildRadarPopulation(
  characters: readonly RadarCharacter[],
  pierceRatios: PierceRatios
): Record<RadarAxis, number[]> {
  const values = characters.map((character) =>
    axisValues(character, pierceRatios)
  )
  return Object.fromEntries(
    radarAxes.map((axis) => [axis, values.map((entry) => entry[axis])])
  ) as Record<RadarAxis, number[]>
}

export function buildStatRadar(
  character: RadarCharacter,
  population: Record<RadarAxis, number[]>,
  pierceRatios: PierceRatios
): RadarAxisResult[] {
  const values = axisValues(character, pierceRatios)
  return radarAxes.map((axis) => ({
    axis,
    value: values[axis],
    percentile: percentileOf(values[axis], population[axis]),
  }))
}
