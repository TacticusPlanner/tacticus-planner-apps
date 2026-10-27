import { describe, expect, it } from "vitest"

import {
  buildRadarPopulation,
  buildStatRadar,
  type RadarCharacter,
} from "./stat-radar"
import type { PierceRatios } from "./pierce-ratios"
import v1Fixture from "./v1-radar.fixture.json"

// V1's pierce table, which the fixture's expected percentiles were computed with: the game's
// `damage-types` ratios except Chain (V1 15%, game 20%) and Plasma (V1 60%, game 65%). Using V1's
// values keeps the comparison a check of the radar formula.
const v1PierceRatios: PierceRatios = new Map(
  Object.entries({
    Bio: 0.3,
    Blast: 0.15,
    Bolter: 0.2,
    Chain: 0.15,
    Energy: 0.3,
    Eviscerate: 0.5,
    Flame: 0.25,
    Gauss: 0.6,
    HeavyRound: 0.55,
    Las: 0.1,
    Melta: 0.75,
    Particle: 0.35,
    Physical: 0.01,
    Piercing: 0.8,
    Plasma: 0.6,
    Power: 0.4,
    Projectile: 0.15,
    Psychic: 1,
    Pulse: 0.2,
    Toxic: 0.7,
  })
)

const tigurius: RadarCharacter = {
  id: "ultraTigurius",
  health: 65,
  damage: 30,
  armour: 14,
  meleeDamage: "Physical",
  meleeHits: 1,
  rangedDamage: "Psychic",
  rangedHits: 1,
}

/** `count` characters with the given base health and nothing else of note. */
function others(count: number, health: number): RadarCharacter[] {
  return Array.from({ length: count }, (_, index) => ({
    ...tigurius,
    id: `other${health}-${index}`,
    health,
  }))
}

describe("buildStatRadar", () => {
  it("computes the spec's worked example: Tigurius's Health percentile", () => {
    // 119 characters: Tigurius, 6 with lower base Health, 112 with higher.
    const catalog = [tigurius, ...others(6, 60), ...others(112, 70)]
    const radar = buildStatRadar(
      tigurius,
      buildRadarPopulation(catalog, v1PierceRatios),
      v1PierceRatios
    )
    const health = radar.find((entry) => entry.axis === "health")

    // round(65 × (1.252^17 + 10) × 2.4) = round(65 × 133.5178) = round(8,678.66)
    expect(health?.value).toBe(8679)
    expect(health?.percentile).toBeCloseTo((6 / 119) * 100)
    expect(Math.round(health?.percentile ?? 0)).toBe(5)
  })

  it("derives the damage axes from hits and the pierce ratio", () => {
    const radar = buildStatRadar(
      tigurius,
      buildRadarPopulation([tigurius], v1PierceRatios),
      v1PierceRatios
    )
    const value = (axis: string) =>
      radar.find((entry) => entry.axis === axis)?.value
    // damage at the reference: round(30 × 133.5178) = 4,006
    expect(value("meleeVsZeroArmour")).toBe(4006)
    expect(value("meleeVsInfiniteArmour")).toBeCloseTo(4006 * 0.01)
    expect(value("rangedVsZeroArmour")).toBe(4006)
    expect(value("rangedVsInfiniteArmour")).toBe(4006)
  })

  it("gives a melee-only unit 0 and 0% on both ranged axes", () => {
    const meleeOnly = {
      ...tigurius,
      id: "meleeOnly",
      rangedDamage: null,
      rangedHits: null,
    }
    const radar = buildStatRadar(
      meleeOnly,
      buildRadarPopulation([meleeOnly, tigurius], v1PierceRatios),
      v1PierceRatios
    )
    for (const axis of ["rangedVsZeroArmour", "rangedVsInfiniteArmour"]) {
      const entry = radar.find((candidate) => candidate.axis === axis)
      expect(entry?.value).toBe(0)
      expect(entry?.percentile).toBe(0)
    }
  })

  it("doesn't count ties as lower", () => {
    const radar = buildStatRadar(
      tigurius,
      buildRadarPopulation([tigurius, ...others(3, 65)], v1PierceRatios),
      v1PierceRatios
    )
    expect(radar.find((entry) => entry.axis === "health")?.percentile).toBe(0)
  })

  it("counts an unknown damage type as piercing nothing", () => {
    const odd = { ...tigurius, id: "odd", meleeDamage: "NotARealType" }
    const radar = buildStatRadar(
      odd,
      buildRadarPopulation([odd], v1PierceRatios),
      v1PierceRatios
    )
    expect(
      radar.find((entry) => entry.axis === "meleeVsInfiniteArmour")?.value
    ).toBe(0)
  })

  it("matches V1's percentiles for the same character data", () => {
    const characters = v1Fixture.characters as RadarCharacter[]
    const population = buildRadarPopulation(characters, v1PierceRatios)
    const expected = v1Fixture.expected as Record<string, number[]>

    expect(Object.keys(expected).length).toBeGreaterThanOrEqual(5)
    for (const [id, percentiles] of Object.entries(expected)) {
      const character = characters.find((candidate) => candidate.id === id)
      if (!character) throw new Error(`${id} missing from the fixture`)
      const radar = buildStatRadar(character, population, v1PierceRatios)
      expect(
        radar.map((entry) => entry.percentile),
        id
      ).toEqual(percentiles.map((value) => expect.closeTo(value, 6)))
    }
  })
})
