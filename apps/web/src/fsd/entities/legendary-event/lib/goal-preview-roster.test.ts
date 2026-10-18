import { describe, expect, it } from "vitest"

import {
  unitClearEstimate,
  unitEffectivePower,
  unitPower,
} from "./clear-estimate"
import {
  UTHAR_ALPHA_BATTLE_8_POWER,
  UTHAR_ALPHA_POWERS,
  WORKED_CONFIG,
  rosterUnit,
  workedInitialRarity,
} from "./clear-estimate.fixtures"
import { previewRoster, previewUnit } from "./goal-preview-roster"

const EIGHT_BATTLES = [...UTHAR_ALPHA_POWERS, UTHAR_ALPHA_BATTLE_8_POWER]

const tiguriusGoals = {
  unitId: "ultraTigurius",
  goals: [
    {
      goalId: "asc",
      kind: "Ascension" as const,
      progressionEnd: "Legendary:RedThreeStars" as const,
    },
    {
      goalId: "rank",
      kind: "Rank" as const,
      rankEnd: "Gold2" as const,
      appliedUpgradesEnd: 0,
    },
  ],
}

describe("previewRoster (spec worked examples)", () => {
  it("previews Tigurius at Gold2, Legendary:RedThreeStars: 28,224, effective 33,868.8, clears 7", () => {
    const synced = [rosterUnit("ultraTigurius")]
    const before = new Map([["ultraTigurius", synced[0]!]])
    expect(
      unitClearEstimate("ultraTigurius", EIGHT_BATTLES, before, WORKED_CONFIG)
        ?.depth
    ).toBe(6)

    const preview = previewRoster(synced, [tiguriusGoals], workedInitialRarity)
    const unit = preview?.roster[0]
    expect(unit).toMatchObject({
      rank: "Gold2",
      progressionIndex: "Legendary:RedThreeStars",
      appliedUpgradeSlots: [],
      abilities: [
        { abilityId: "active", level: 20 },
        { abilityId: "passive", level: 15 },
      ],
    })
    expect(preview?.previewed).toEqual(new Set(["ultraTigurius"]))
    const after = new Map([["ultraTigurius", unit!]])
    expect(unitPower("ultraTigurius", after, WORKED_CONFIG.unitPower)).toBe(
      28224
    )
    expect(
      unitEffectivePower("ultraTigurius", after, WORKED_CONFIG)
    ).toBeCloseTo(33868.8, 6)
    // 169,344 reaches battle 7's 161,523.6 and not battle 8's 270,462.
    expect(
      unitClearEstimate("ultraTigurius", EIGHT_BATTLES, after, WORKED_CONFIG)
    ).toMatchObject({ depth: 7, battleCount: 8 })
  })

  it("previews an Unlock goal as the base unit: Certus 45, clears 0", () => {
    const preview = previewRoster(
      [],
      [
        {
          unitId: "ultraEliminatorSgt",
          goals: [{ goalId: "u", kind: "Unlock" }],
        },
      ],
      workedInitialRarity
    )
    const unit = preview?.roster[0]
    expect(unit).toEqual({
      unitId: "ultraEliminatorSgt",
      rank: "Stone1",
      progressionIndex: "Common:None",
      appliedUpgradeSlots: [],
    })
    const unlocked = new Map([["ultraEliminatorSgt", unit!]])
    expect(
      unitPower("ultraEliminatorSgt", unlocked, WORKED_CONFIG.unitPower)
    ).toBe(45)
    // 5 × 45 = 225 is below battle 1's 1,221.6.
    expect(
      unitClearEstimate(
        "ultraEliminatorSgt",
        EIGHT_BATTLES,
        unlocked,
        WORKED_CONFIG
      )?.depth
    ).toBe(0)
  })

  it("never lowers a value", () => {
    const unit = { ...rosterUnit("ultraCalgar"), rank: "Diamond1" as const }
    const preview = previewRoster(
      [unit],
      [
        {
          unitId: "ultraCalgar",
          goals: [
            {
              goalId: "r",
              kind: "Rank",
              rankEnd: "Gold3",
              appliedUpgradesEnd: 6,
            },
            {
              goalId: "a",
              kind: "Ascension",
              progressionEnd: "Rare:FourStars",
            },
            { goalId: "b", kind: "Ability", activeEnd: 10, passiveEnd: 10 },
          ],
        },
      ],
      workedInitialRarity
    )
    expect(preview?.roster[0]).toEqual(unit)
    expect(preview?.previewed.size).toBe(0)
  })

  it("raises applied upgrades on an equal-rank goal and ability levels", () => {
    const unit = previewUnit(
      rosterUnit("ultraCalgar"),
      {
        unitId: "ultraCalgar",
        goals: [
          {
            goalId: "r",
            kind: "Rank",
            rankEnd: "Gold1",
            appliedUpgradesEnd: 5,
          },
          { goalId: "b", kind: "Ability", activeEnd: 30, passiveEnd: 10 },
        ],
      },
      "Legendary"
    )
    expect(unit.appliedUpgradeSlots).toEqual([0, 1, 2, 3, 4])
    expect(unit.abilities?.map((ability) => ability.level)).toEqual([30, 15])
  })

  it("keeps the applied slots on an equal-rank goal and fills the lowest missing ones", () => {
    const unit = previewUnit(
      {
        ...rosterUnit("ultraCalgar"),
        rank: "Gold1",
        appliedUpgradeSlots: [0, 2, 4],
      },
      {
        unitId: "ultraCalgar",
        goals: [
          {
            goalId: "r",
            kind: "Rank",
            rankEnd: "Gold1",
            appliedUpgradesEnd: 4,
          },
        ],
      },
      "Legendary"
    )
    expect(unit.appliedUpgradeSlots).toEqual([0, 1, 2, 4])
  })

  it("leaves a unit without goals as synced, and an unsynced roster unknown", () => {
    const synced = [rosterUnit("ultraTitus")]
    const preview = previewRoster(
      synced,
      [{ unitId: "ultraTitus", goals: [] }],
      workedInitialRarity
    )
    expect(preview?.roster).toEqual(synced)
    expect(preview?.previewed.size).toBe(0)
    expect(previewRoster(undefined, [tiguriusGoals], workedInitialRarity)).toBe(
      undefined
    )
  })
})
