import { describe, expect, it, vi } from "vitest"

import {
  buildRadarPopulation,
  buildStatRadar,
  type RadarCharacter,
} from "./stat-radar"
import v1Fixture from "./v1-radar.fixture.json"

// The fixture's expected percentiles were computed by V1, whose pierce table predates the wiki
// corrections for Chain (V1 15%) and Plasma (V1 60%). Using V1's values here keeps the comparison a
// check of the radar formula; the corrected table itself is tested in game-domain.
vi.mock("@workspace/game-domain", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@workspace/game-domain")>()
  const v1Corrections: Record<string, number> = { Chain: 0.15, Plasma: 0.6 }
  return {
    ...actual,
    pierceRatio: (damageType: string) =>
      v1Corrections[damageType] ?? actual.pierceRatio(damageType),
  }
})

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
    const radar = buildStatRadar(tigurius, buildRadarPopulation(catalog))
    const health = radar.find((entry) => entry.axis === "health")

    // round(65 × (1.252^17 + 10) × 2.4) = round(65 × 133.5178) = round(8,678.66)
    expect(health?.value).toBe(8679)
    expect(health?.percentile).toBeCloseTo((6 / 119) * 100)
    expect(Math.round(health?.percentile ?? 0)).toBe(5)
  })

  it("derives the damage axes from hits and the pierce ratio", () => {
    const radar = buildStatRadar(tigurius, buildRadarPopulation([tigurius]))
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
      buildRadarPopulation([meleeOnly, tigurius])
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
      buildRadarPopulation([tigurius, ...others(3, 65)])
    )
    expect(radar.find((entry) => entry.axis === "health")?.percentile).toBe(0)
  })

  it("counts an unknown damage type as piercing nothing", () => {
    const odd = { ...tigurius, id: "odd", meleeDamage: "NotARealType" }
    const radar = buildStatRadar(odd, buildRadarPopulation([odd]))
    expect(
      radar.find((entry) => entry.axis === "meleeVsInfiniteArmour")?.value
    ).toBe(0)
  })

  it("matches V1's percentiles for the same character data", () => {
    const characters = v1Fixture.characters as RadarCharacter[]
    const population = buildRadarPopulation(characters)
    const expected = v1Fixture.expected as Record<string, number[]>

    expect(Object.keys(expected).length).toBeGreaterThanOrEqual(5)
    for (const [id, percentiles] of Object.entries(expected)) {
      const character = characters.find((candidate) => candidate.id === id)
      if (!character) throw new Error(`${id} missing from the fixture`)
      const radar = buildStatRadar(character, population)
      expect(
        radar.map((entry) => entry.percentile),
        id
      ).toEqual(percentiles.map((value) => expect.closeTo(value, 6)))
    }
  })
})
