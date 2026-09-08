import { describe, expect, it } from "vitest"

import {
  describeModifier,
  formatModifierAmount,
  humanizeToken,
} from "./format-modifier"
import type { RaidBossEncounterModifier } from "../model/types"

const modifier = (
  over: Partial<RaidBossEncounterModifier>
): RaidBossEncounterModifier => ({
  hpLost: 100,
  modifierId: "m",
  type: "bossStatDecrease",
  target: "damage",
  amount: 1,
  ...over,
})

describe("humanizeToken", () => {
  it("splits camelCase and PascalCase", () => {
    expect(humanizeToken("bossStatDecrease")).toBe("boss Stat Decrease")
    expect(humanizeToken("MassiveScythingTalons")).toBe(
      "Massive Scything Talons"
    )
    expect(humanizeToken("worldEaters")).toBe("world Eaters")
  })
})

describe("formatModifierAmount", () => {
  it("renders a flat decrease with a minus sign", () => {
    expect(
      formatModifierAmount(modifier({ type: "bossStatDecrease", amount: 2 }))
    ).toBe("−2")
  })

  it("renders a percent type as a rounded percentage", () => {
    expect(
      formatModifierAmount(
        modifier({ type: "bossStatPctDecrease", amount: 0.15 })
      )
    ).toBe("−15%")
  })

  it("renders an increase type with a plus sign", () => {
    expect(
      formatModifierAmount(
        modifier({ type: "bossAbilityConstantIncrease", amount: 3 })
      )
    ).toBe("+3")
  })
})

describe("describeModifier", () => {
  it("prefers the subtarget over the target and humanizes it", () => {
    expect(
      describeModifier(
        modifier({
          type: "bossStatPctDecrease",
          subtarget: "critChance",
          amount: 0.1,
        })
      )
    ).toBe("−10% crit Chance")
  })

  it("falls back to the target when there is no subtarget", () => {
    expect(describeModifier(modifier({ target: "movement", amount: 1 }))).toBe(
      "−1 movement"
    )
  })
})
