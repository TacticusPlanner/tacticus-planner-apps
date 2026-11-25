import { describe, expect, it } from "vitest"

import {
  buildRadarPopulation,
  buildStatRadar,
  radarAxisIcon,
} from "./stat-radar"
import type { RadarCharacter } from "./stat-radar"
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

  it("leaves a melee-only unit out of both ranged axes", () => {
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
    const shooter = buildStatRadar(
      tigurius,
      buildRadarPopulation([meleeOnly, tigurius], v1PierceRatios),
      v1PierceRatios
    )
    for (const axis of ["rangedVsZeroArmour", "rangedVsInfiniteArmour"]) {
      const entry = radar.find((candidate) => candidate.axis === axis)
      expect(entry?.value).toBeNull()
      expect(entry?.percentile).toBeNull()
      // The only shooter is also the weakest: the melee-only unit isn't below it.
      expect(
        shooter.find((candidate) => candidate.axis === axis)?.percentile
      ).toBe(0)
    }
  })

  it("compares a shooter of an unknown damage type on both ranged axes", () => {
    const odd = { ...tigurius, id: "odd", rangedDamage: "NotARealType" }
    const population = buildRadarPopulation([odd, tigurius], v1PierceRatios)
    expect(population.rangedVsInfiniteArmour).toEqual([0, 4006])
    expect(population.rangedVsZeroArmour).toEqual([4006, 4006])
  })

  it("computes the spec's worked example: Daras's ranged percentiles", () => {
    const daras: RadarCharacter = {
      ...tigurius,
      id: "lostaFearmonger",
      damage: 31,
      meleeHits: 3,
      rangedDamage: "Bolter",
      rangedHits: 1,
    }
    const shooters = (count: number, rest: Partial<RadarCharacter>) =>
      Array.from({ length: count }, () => ({ ...daras, ...rest }))
    // 59 shooters: 2 lower on both axes, 12 lower only vs 0 armour, 44 higher on both; 61 melee-only.
    const catalog = [
      daras,
      ...shooters(2, { damage: 20 }),
      ...shooters(12, { damage: 20, rangedDamage: "Psychic" }),
      ...shooters(44, { damage: 40 }),
      ...shooters(61, { rangedDamage: null, rangedHits: null }),
    ]
    const radar = buildStatRadar(
      daras,
      buildRadarPopulation(catalog, v1PierceRatios),
      v1PierceRatios
    )
    const entry = (axis: string) =>
      radar.find((candidate) => candidate.axis === axis)

    expect(entry("rangedVsInfiniteArmour")?.value).toBe(827.8)
    expect(entry("rangedVsInfiniteArmour")?.percentile).toBeCloseTo(
      (2 / 59) * 100
    )
    expect(entry("rangedVsZeroArmour")?.value).toBe(4139)
    expect(entry("rangedVsZeroArmour")?.percentile).toBeCloseTo((14 / 59) * 100)
  })

  it("ties equal damage values despite floating-point error, and no others", () => {
    const melee = (
      id: string,
      damage: number,
      meleeHits: number,
      meleeDamage: string
    ): RadarCharacter => ({ ...tigurius, id, damage, meleeHits, meleeDamage })
    const infinite = (character: RadarCharacter, catalog: RadarCharacter[]) =>
      buildStatRadar(
        character,
        buildRadarPopulation(catalog, v1PierceRatios),
        v1PierceRatios
      ).find((entry) => entry.axis === "meleeVsInfiniteArmour")

    const celestine = melee("celestine", 25, 3, "Power")
    const anuphet = melee("anuphet", 25, 4, "Energy")
    for (const character of [celestine, anuphet]) {
      const entry = infinite(character, [celestine, anuphet])
      expect(entry?.value).toBe(4005.6)
      expect(entry?.percentile).toBe(0)
    }

    // 5,341 × 3 × 0.25 = 4,005.75, a real difference from 4,006 × 1 × 1.
    const lower = melee("lower", 40, 3, "Flame")
    const higher = melee("higher", 30, 1, "Psychic")
    expect(infinite(lower, [lower, higher])?.value).toBe(4005.75)
    expect(infinite(higher, [lower, higher])?.percentile).toBe(50)
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

  // V1 counts characters without a ranged attack as 0, so its ranged percentiles differ on purpose.
  it("matches V1's Health, Armour and melee percentiles for the same character data", () => {
    const characters = v1Fixture.characters as RadarCharacter[]
    const population = buildRadarPopulation(characters, v1PierceRatios)
    const expected = v1Fixture.expected as Record<string, number[]>

    expect(Object.keys(expected).length).toBeGreaterThanOrEqual(5)
    for (const [id, percentiles] of Object.entries(expected)) {
      const character = characters.find((candidate) => candidate.id === id)
      if (!character) throw new Error(`${id} missing from the fixture`)
      const radar = buildStatRadar(character, population, v1PierceRatios)
      expect(
        radar.slice(0, 4).map((entry) => entry.percentile),
        id
      ).toEqual(
        percentiles.slice(0, 4).map((value) => expect.closeTo(value, 6))
      )
    }
  })
})

describe("radarAxisIcon", () => {
  it("uses the stat itself, or the attack kind for a damage axis", () => {
    expect(radarAxisIcon("health")).toBe("health")
    expect(radarAxisIcon("armour")).toBe("armour")
    expect(radarAxisIcon("meleeVsZeroArmour")).toBe("melee")
    expect(radarAxisIcon("rangedVsInfiniteArmour")).toBe("ranged")
  })
})
