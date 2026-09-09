import { describe, expect, it } from "vitest"

import type { RaidBossEncounterModifier } from "../model/types"
import {
  applyAbilityConstantAdjustments,
  applyAbilityVariableAdjustments,
  applyStatAdjustment,
  applyUnitRemovals,
  buildModifierHpLostOptions,
  computeAbilityAdjustments,
  computeStatAdjustments,
  computeUnitRemovals,
  getActiveModifiers,
  parseSubtargets,
  scaleModifierHpLost,
  sortModifiersByHpLost,
} from "./modifier-math"

// Expected values derived from V1 `4-entities/guild_boss/guild-boss-modifiers.ts` (the V1 spec file
// only covers encounter-location helpers, not this math).

const mod = (
  partial: Partial<RaidBossEncounterModifier> & { type: string }
): RaidBossEncounterModifier =>
  ({
    hpLost: 0,
    modifierId: "m",
    target: "dmg",
    amount: 10,
    ...partial,
  }) as RaidBossEncounterModifier

describe("parseSubtargets", () => {
  it("splits a comma-separated subtarget", () => {
    expect(parseSubtargets(mod({ type: "x", subtarget: "a,b,c" }))).toEqual([
      "a",
      "b",
      "c",
    ])
  })
  it("returns [] with no subtarget", () => {
    expect(parseSubtargets(mod({ type: "x" }))).toEqual([])
  })
})

describe("sortModifiersByHpLost", () => {
  it("sorts ascending without mutating the input", () => {
    const input = [
      mod({ type: "x", hpLost: 30 }),
      mod({ type: "x", hpLost: 10 }),
    ]
    const sorted = sortModifiersByHpLost(input)
    expect(sorted.map((m) => m.hpLost)).toEqual([10, 30])
    expect(input.map((m) => m.hpLost)).toEqual([30, 10])
  })
})

describe("scaleModifierHpLost", () => {
  it("rescales thresholds proportionally with the last at the total", () => {
    const mods = [
      mod({ type: "x", hpLost: 1 }),
      mod({ type: "x", hpLost: 2 }),
      mod({ type: "x", hpLost: 3 }),
    ]
    expect(scaleModifierHpLost(mods, 900).map((m) => m.hpLost)).toEqual([
      300, 600, 900,
    ])
  })
  it("keeps the final entry exactly at the total HP", () => {
    const mods = [1, 2, 3, 4].map((n) => mod({ type: "x", hpLost: n }))
    expect(scaleModifierHpLost(mods, 100).map((m) => m.hpLost)).toEqual([
      25, 50, 75, 100,
    ])
  })
})

describe("buildModifierHpLostOptions", () => {
  it("prepends 0 to the sorted thresholds", () => {
    const mods = [
      mod({ type: "x", hpLost: 10 }),
      mod({ type: "x", hpLost: 25 }),
    ]
    expect(buildModifierHpLostOptions(mods)).toEqual([0, 10, 25])
  })
})

describe("getActiveModifiers", () => {
  it("returns modifiers at or below the selected HP-lost point", () => {
    const mods = [
      mod({ type: "x", hpLost: 10, modifierId: "a" }),
      mod({ type: "x", hpLost: 20, modifierId: "b" }),
      mod({ type: "x", hpLost: 30, modifierId: "c" }),
    ]
    expect(getActiveModifiers(mods, 20).map((m) => m.modifierId)).toEqual([
      "a",
      "b",
    ])
  })
})

describe("computeStatAdjustments / applyStatAdjustment", () => {
  it("sums percent and flat decreases per stat target", () => {
    const active = [
      mod({ type: "bossStatPctDecrease", target: "dmg", amount: 30 }),
      mod({ type: "bossStatPctDecrease", target: "dmg", amount: 15 }),
      mod({ type: "bossStatDecrease", target: "movement", amount: 1 }),
    ]
    const adj = computeStatAdjustments(active)
    expect(adj.pctByStat).toEqual({ dmg: -45 })
    expect(adj.flatByStat).toEqual({ movement: -1 })
    expect(applyStatAdjustment(1000, "dmg", adj)).toBe(550)
    expect(applyStatAdjustment(4, "movement", adj)).toBe(3)
    expect(applyStatAdjustment(1000, "fixedArmor", adj)).toBe(1000) // untouched
  })
  it("clamps at 0", () => {
    const adj = computeStatAdjustments([
      mod({ type: "bossStatDecrease", target: "movement", amount: 5 }),
    ])
    expect(applyStatAdjustment(2, "movement", adj)).toBe(0)
  })
})

describe("computeAbilityAdjustments / applyAbility*", () => {
  const active = [
    mod({
      type: "bossAbilityAllStatsPctDecrease",
      target: "Talons",
      amount: 20,
    }),
    mod({
      type: "bossAbilityVariablePctDecrease",
      target: "Talons",
      subtarget: "minDmg,maxDmg",
      amount: 10,
    }),
    mod({
      type: "bossAbilityConstantIncrease",
      target: "Other",
      subtarget: "range",
      amount: 1,
    }),
  ]

  it("sums pctAll, per-variable pct, and signed flat by ability", () => {
    const adj = computeAbilityAdjustments(active, "Talons")
    expect(adj.pctAll).toBe(-20)
    expect(adj.pctByVariable).toEqual({ minDmg: -10, maxDmg: -10 })
    expect(adj.flatByVariable).toEqual({})

    const other = computeAbilityAdjustments(active, "Other")
    expect(other.flatByVariable).toEqual({ range: 1 })
  })

  it("applies to every level entry, clamped, non-numeric passthrough", () => {
    const adj = computeAbilityAdjustments(active, "Talons")
    const out = applyAbilityVariableAdjustments(
      { minDmg: [100, 200], label: ["a", "b"] },
      adj
    )
    // minDmg: pctAll -20 + perVar -10 = -30 -> round(100*0.7)=70, round(200*0.7)=140
    expect(out.minDmg).toEqual([70, 140])
    expect(out.label).toEqual(["a", "b"])
  })

  it("leaves an unaffected variable array by reference", () => {
    const adj = computeAbilityAdjustments([], "Talons")
    const variables = { dmg: [1, 2] }
    expect(applyAbilityVariableAdjustments(variables, adj).dmg).toBe(
      variables.dmg
    )
  })

  it("adjusts constants as strings", () => {
    const adj = computeAbilityAdjustments(
      [
        mod({
          type: "bossAbilityAllStatsPctDecrease",
          target: "Talons",
          amount: 50,
        }),
      ],
      "Talons"
    )
    expect(applyAbilityConstantAdjustments({ hp: "100" }, adj)).toEqual({
      hp: "50",
    })
  })
})

describe("computeUnitRemovals / applyUnitRemovals", () => {
  it("removes up to N copies of a targeted npc and reports the count", () => {
    const active = [
      mod({
        type: "unitAmountDecrease",
        target: "unitId",
        subtarget: "GuildBoss6Npc1Hormagaunt",
        amount: 1,
      }),
    ]
    const removals = computeUnitRemovals(active)
    expect(removals).toEqual({ GuildBoss6Npc1Hormagaunt: 1 })

    const result = applyUnitRemovals(
      [
        "GuildBoss6Npc1Hormagaunt",
        "GuildBoss6Npc1Hormagaunt",
        "GuildBoss6Npc2Barbgaunt",
      ],
      removals
    )
    expect(result.ids).toEqual([
      "GuildBoss6Npc1Hormagaunt",
      "GuildBoss6Npc2Barbgaunt",
    ])
    expect(result.removed).toEqual([
      { unitSetId: "GuildBoss6Npc1Hormagaunt", count: 1 },
    ])
  })

  it("ignores a progression suffix when matching", () => {
    const result = applyUnitRemovals(["GuildBoss6Npc1Hormagaunt:3"], {
      GuildBoss6Npc1Hormagaunt: 1,
    })
    expect(result.ids).toEqual([])
  })
})
