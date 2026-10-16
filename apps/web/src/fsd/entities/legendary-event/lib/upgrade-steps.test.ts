import { describe, expect, it } from "vitest"

import { rosterUnit } from "./clear-estimate.fixtures"
import { nextUpgradeSteps } from "./upgrade-steps"

describe("nextUpgradeSteps", () => {
  it("offers only Ascension at the Epic Gold1 cap", () => {
    const steps = nextUpgradeSteps(
      rosterUnit("ultraTigurius", "Epic:RedTwoStars"),
      "ultraTigurius",
      "Uncommon"
    )
    expect(steps.map((step) => step.kind)).toEqual(["ascension"])
    expect(steps[0]).toMatchObject({
      progression: "Epic:RedThreeStars",
      unit: { rank: "Gold1", progressionIndex: "Epic:RedThreeStars" },
    })
  })

  it("ranks a Legendary Silver2 to Silver3 with no applied upgrades", () => {
    const unit = {
      ...rosterUnit("ultraCalgar", "Legendary:RedThreeStars"),
      rank: "Silver2" as const,
    }
    const [rank] = nextUpgradeSteps(unit, "ultraCalgar", "Legendary")
    expect(rank).toMatchObject({
      kind: "rank",
      rank: "Silver3",
      unit: { rank: "Silver3", appliedUpgradeSlots: [] },
    })
    // Ability levels never change.
    expect(rank?.unit.abilities).toEqual(unit.abilities)
  })

  it("unlocks a locked unit to its initial rarity's first step", () => {
    expect(nextUpgradeSteps(undefined, "ultraEliminatorSgt", "Common")).toEqual(
      [
        {
          kind: "unlock",
          unit: {
            unitId: "ultraEliminatorSgt",
            rank: "Stone1",
            progressionIndex: "Common:None",
            appliedUpgradeSlots: [],
          },
        },
      ]
    )
    expect(
      nextUpgradeSteps(undefined, "ultraCalgar", "Legendary")[0]?.unit
        .progressionIndex
    ).toBe("Legendary:RedThreeStars")
    expect(
      nextUpgradeSteps(undefined, "ultraTitus", "Rare")[0]?.unit
        .progressionIndex
    ).toBe("Rare:FourStars")
  })

  it("offers no Ascension at the last progression step", () => {
    const unit = {
      ...rosterUnit("ultraCalgar", "Mythic:MythicWings"),
      rank: "Adamantine2" as const,
    }
    expect(nextUpgradeSteps(unit, "ultraCalgar", "Legendary")).toEqual([])
  })
})
