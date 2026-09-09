import { describe, expect, it } from "vitest"

import { describeModifier, humanizeToken } from "./format-modifier"
import type { RaidBossEncounterModifier } from "../model/types"

const modifier = (
  over: Partial<RaidBossEncounterModifier>
): RaidBossEncounterModifier => ({
  hpLost: 100,
  modifierId: "m",
  type: "bossStatDecrease",
  target: "movement",
  amount: 1,
  ...over,
})

describe("humanizeToken", () => {
  it("splits camelCase and PascalCase", () => {
    expect(humanizeToken("bossStatDecrease")).toBe("boss Stat Decrease")
    expect(humanizeToken("MassiveScythingTalons")).toBe(
      "Massive Scything Talons"
    )
  })
})

describe("describeModifier", () => {
  it("renders a flat stat delta with its literal value", () => {
    expect(
      describeModifier(
        modifier({ type: "bossStatDecrease", target: "movement" })
      )
    ).toEqual({ kind: "amount", text: "−1 movement" })
  })

  it("renders a genuine stat percent as a whole-number percentage (no ×100)", () => {
    expect(
      describeModifier(
        modifier({ type: "bossStatPctDecrease", target: "dmg", amount: 15 })
      )
    ).toEqual({ kind: "amount", text: "−15% dmg" })
  })

  it("renders an ability-scaling modifier as a direction + target, dropping the raw amount", () => {
    expect(
      describeModifier(
        modifier({
          type: "bossAbilityAllStatsPctDecrease",
          target: "MassiveScythingTalons",
          amount: 1500,
        })
      )
    ).toEqual({
      kind: "effect",
      direction: "reduces",
      label: "Massive Scything Talons",
    })
  })

  it("uses the up direction for increase types", () => {
    expect(
      describeModifier(
        modifier({
          type: "bossAbilityVariableIncrease",
          target: "WeakerRearArmour",
          subtarget: "extraCritChance",
          amount: 10,
        })
      )
    ).toEqual({
      kind: "effect",
      direction: "increases",
      label: "extra Crit Chance",
    })
  })

  it("name-resolves a raw unit id in the subtarget", () => {
    expect(
      describeModifier(
        modifier({
          type: "unitAmountDecrease",
          target: "unitId",
          subtarget: "GuildBoss6Npc5TyranBarbgaunt",
          amount: 1,
        })
      )
    ).toEqual({ kind: "effect", direction: "reduces", label: "Barbgaunt" })
  })
})
