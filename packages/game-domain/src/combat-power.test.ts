import { describe, expect, it } from "vitest"

import {
  abilityCoeff,
  characterAbilityPower,
  characterAttributePower,
  characterCombatPower,
  type CharacterCombatPowerInput,
} from "./combat-power"

const base: CharacterCombatPowerInput = {
  unlocked: true,
  rank: "Stone1",
  progression: "Common:None",
  appliedUpgradeCount: 0,
  activeAbilityLevel: 1,
  passiveAbilityLevel: 1,
}

describe("abilityCoeff — V1 piecewise curve boundaries", () => {
  it.each([
    [22, 22],
    [39, 86.6],
    [40, 91.9],
    [44, 125.5],
    [50, 229.3],
    [60, 579.3],
  ])("abilityCoeff(%i) ≈ %f", (level, expected) => {
    expect(abilityCoeff(level)).toBeCloseTo(expected, 6)
  })

  it("is continuous across each branch boundary", () => {
    for (const boundary of [22, 39, 40, 44, 50]) {
      expect(
        abilityCoeff(boundary + 1) - abilityCoeff(boundary)
      ).toBeGreaterThan(0)
    }
  })
})

describe("characterCombatPower", () => {
  it("is 0 for a unit that is not unlocked", () => {
    expect(
      characterCombatPower({
        ...base,
        unlocked: false,
        rank: "Gold1",
        progression: "Epic:RedOneStar",
        appliedUpgradeCount: 3,
        activeAbilityLevel: 20,
        passiveAbilityLevel: 15,
      })
    ).toBe(0)
    expect(characterAttributePower({ ...base, unlocked: false })).toBe(0)
    expect(characterAbilityPower({ ...base, unlocked: false })).toBe(0)
  })

  // The worked example from specs/character-combat-power/spec.md.
  it("matches the spec worked example (Gold1 / Epic:RedOneStar / 3 upgrades / 20 / 15)", () => {
    const input: CharacterCombatPowerInput = {
      unlocked: true,
      rank: "Gold1",
      progression: "Epic:RedOneStar",
      appliedUpgradeCount: 3,
      activeAbilityLevel: 20,
      passiveAbilityLevel: 15,
    }
    expect(characterAttributePower(input)).toBe(8114)
    expect(characterAbilityPower(input)).toBe(678)
    expect(characterCombatPower(input)).toBe(8792)
  })

  it("handles the bottom of the ladder (Stone1 / Common:None / 0 upgrades / 1 / 1)", () => {
    expect(characterAttributePower(base)).toBe(322)
    expect(characterAbilityPower(base)).toBe(24)
    expect(characterCombatPower(base)).toBe(346)
  })

  it("handles the top of the ladder without NaN (Adamantine2 / Mythic:MythicWings / 9 / 60 / 55)", () => {
    const input: CharacterCombatPowerInput = {
      unlocked: true,
      rank: "Adamantine2",
      progression: "Mythic:MythicWings",
      appliedUpgradeCount: 9,
      activeAbilityLevel: 60,
      passiveAbilityLevel: 55,
    }
    expect(characterAttributePower(input)).toBe(53571)
    expect(characterAbilityPower(input)).toBe(23831)
    expect(characterCombatPower(input)).toBe(77402)
  })

  it("scales monotonically with rank, progression, upgrades, and ability levels", () => {
    const start = characterCombatPower(base)
    expect(characterCombatPower({ ...base, rank: "Iron1" })).toBeGreaterThan(
      start
    )
    expect(
      characterCombatPower({ ...base, progression: "Common:OneStar" })
    ).toBeGreaterThan(start)
    expect(
      characterCombatPower({ ...base, rank: "Iron1", appliedUpgradeCount: 3 })
    ).toBeGreaterThan(characterCombatPower({ ...base, rank: "Iron1" }))
    expect(
      characterCombatPower({ ...base, activeAbilityLevel: 10 })
    ).toBeGreaterThan(start)
  })
})
