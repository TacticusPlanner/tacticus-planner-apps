import { describe, expect, it } from "vitest"

import { rosterUnit } from "./clear-estimate.fixtures"
import { unitCombatPower, unitCombatPowerInput } from "./unit-combat-power"

describe("unitCombatPower", () => {
  it("reproduces 8,792 for Gold1 / Epic:RedOneStar / 3 upgrades / 20 / 15", () => {
    expect(unitCombatPowerInput(rosterUnit("ultraCalgar"))).toEqual({
      unlocked: true,
      rank: "Gold1",
      progression: "Epic:RedOneStar",
      appliedUpgradeCount: 3,
      activeAbilityLevel: 20,
      passiveAbilityLevel: 15,
    })
    expect(unitCombatPower(rosterUnit("ultraCalgar"))).toBe(8792)
  })

  it("is 0 for a unit the roster does not hold", () => {
    expect(unitCombatPowerInput(undefined).unlocked).toBe(false)
    expect(unitCombatPower(undefined)).toBe(0)
  })

  it("counts distinct upgrade slots and defaults missing abilities to level 1", () => {
    const input = unitCombatPowerInput({
      ...rosterUnit("ultraCalgar"),
      appliedUpgradeSlots: [0, 0, 1],
      abilities: [],
    })
    expect(input.appliedUpgradeCount).toBe(2)
    expect(input.activeAbilityLevel).toBe(1)
    expect(input.passiveAbilityLevel).toBe(1)
  })
})
