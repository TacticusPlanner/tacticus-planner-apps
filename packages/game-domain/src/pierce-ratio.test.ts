import { describe, expect, it } from "vitest"

import { pierceRatio } from "./pierce-ratio"

// Every damage type the served `characters` catalog uses for melee and ranged attacks.
const catalogDamageTypes = [
  "Bio",
  "Blast",
  "Bolter",
  "Chain",
  "Energy",
  "Eviscerate",
  "Flame",
  "Gauss",
  "HeavyRound",
  "Las",
  "Melta",
  "Particle",
  "Physical",
  "Piercing",
  "Plasma",
  "Power",
  "Projectile",
  "Psychic",
  "Pulse",
  "Toxic",
]

describe("pierceRatio", () => {
  it("resolves every catalog damage type to a ratio between 0 and 1", () => {
    for (const damageType of catalogDamageTypes) {
      const ratio = pierceRatio(damageType)
      expect(ratio, damageType).toBeGreaterThan(0)
      expect(ratio, damageType).toBeLessThanOrEqual(1)
    }
  })

  it("follows the wiki's table, including its corrections to V1", () => {
    expect(pierceRatio("Physical")).toBe(0.01)
    expect(pierceRatio("Psychic")).toBe(1)
    expect(pierceRatio("Direct")).toBe(1)
    expect(pierceRatio("Piercing")).toBe(0.8)
    expect(pierceRatio("Chain")).toBe(0.2)
    expect(pierceRatio("Plasma")).toBe(0.65)
  })

  it("treats V1's display spellings as the catalog's types", () => {
    expect(pierceRatio("Heavy Round")).toBe(pierceRatio("HeavyRound"))
    expect(pierceRatio("HeavyRound")).toBe(0.55)
    expect(pierceRatio("Molecular")).toBe(pierceRatio("Gauss"))
    expect(pierceRatio("Gauss")).toBe(0.6)
    expect(pierceRatio("Direct")).toBe(pierceRatio("DirectDamage"))
  })

  it("knows the game config's types the wiki table lacks", () => {
    expect(pierceRatio("DirectDamage")).toBe(1)
    expect(pierceRatio("Acid")).toBe(0.4)
  })

  it("returns undefined for an unknown damage type", () => {
    expect(pierceRatio("NotARealDamageType")).toBeUndefined()
  })
})
