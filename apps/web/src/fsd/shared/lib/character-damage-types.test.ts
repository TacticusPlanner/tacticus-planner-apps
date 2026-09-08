import { describe, expect, it } from "vitest"

import { characterDamageTypes } from "./character-damage-types"

describe("characterDamageTypes", () => {
  it("returns the melee type for a melee-only character", () => {
    expect(
      characterDamageTypes({
        meleeDamage: "Physical",
        rangedDamage: null,
        activeAbilityDamage: [],
        passiveAbilityDamage: [],
      })
    ).toEqual(["Physical"])
  })

  it("unions melee, ranged, and ability damage types without duplicates", () => {
    expect(
      characterDamageTypes({
        meleeDamage: "Physical",
        rangedDamage: "Bolter",
        activeAbilityDamage: ["Physical", "Psychic"],
        passiveAbilityDamage: ["Flame"],
      }).sort()
    ).toEqual(["Bolter", "Flame", "Physical", "Psychic"])
  })

  it("tolerates missing ability-damage arrays on stale cached rows", () => {
    expect(
      characterDamageTypes({
        meleeDamage: "Power",
        rangedDamage: null,
      })
    ).toEqual(["Power"])
  })
})
