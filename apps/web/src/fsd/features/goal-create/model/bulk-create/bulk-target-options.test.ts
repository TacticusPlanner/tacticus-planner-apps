import { describe, expect, it } from "vitest"
import {
  maxAbilityLevel,
  progressionIndex,
  rankIndex,
  type Progression,
  type Rank,
  type UnitId,
} from "@workspace/game-domain"

import type { BulkGoalUnit } from "./bulk-goal-plan"
import { bulkTargetOptions, snapUp } from "./bulk-target-options"

const character = (
  rank: Rank,
  progression: Progression,
  abilityLevels: readonly [number, number]
): BulkGoalUnit => ({
  kind: "character",
  unitId: `c-${rank}` as UnitId,
  name: "Unit",
  owned: true,
  progression,
  rank,
  abilityLevels,
})

const mow: BulkGoalUnit = {
  kind: "mow",
  unitId: "m" as UnitId,
  name: "MoW",
  owned: true,
  progression: "Common:OneStar",
  abilityLevels: [5, 3],
}

const unownedCharacter: BulkGoalUnit = {
  kind: "character",
  unitId: "locked" as UnitId,
  name: "Locked",
  owned: false,
  startProgression: "Rare:FourStars",
}

describe("bulkTargetOptions", () => {
  it("starts each picker one step above the lowest current value", () => {
    const options = bulkTargetOptions([
      character("Gold1", "Legendary:RedThreeStars", [35, 35]),
      character("Silver3", "Epic:RedOneStar", [20, 26]),
    ])
    expect(options.rankOptions[0]).toBe("Gold1")
    expect(options.rankOptions).not.toContain("Silver3")
    expect(options.progressionOptions[0]).toBe("Epic:RedTwoStars")
    expect(options.abilityMin).toBe(21)
  })

  it("ignores Machines of War for Rank but counts them for the rest", () => {
    const options = bulkTargetOptions([
      character("Diamond1", "Legendary:RedThreeStars", [40, 40]),
      mow,
    ])
    expect(options.rankOptions[0]).toBe("Diamond2")
    expect(options.progressionOptions[0]).toBe("Common:TwoStars")
    expect(options.abilityMin).toBe(4)
  })

  it("counts an unowned unit from its starting values", () => {
    const options = bulkTargetOptions([
      character("Diamond1", "Legendary:RedThreeStars", [40, 40]),
      unownedCharacter,
    ])
    expect(options.rankOptions[0]).toBe("Stone2")
    expect(progressionIndex(options.progressionOptions[0]!)).toBe(
      progressionIndex("Rare:FourStars") + 1
    )
    expect(options.abilityMin).toBe(2)
  })

  it("raises the floors once the lowest unit is gone", () => {
    const high = character("Diamond3", "Mythic:OneBlueStar", [50, 50])
    const low = character("Bronze1", "Rare:FourStars", [10, 10])
    expect(bulkTargetOptions([high, low]).rankOptions[0]).toBe("Bronze2")
    expect(bulkTargetOptions([high]).rankOptions[0]).toBe("Adamantine1")
  })

  it("offers nothing when every unit is already at the top", () => {
    const options = bulkTargetOptions([
      character("Adamantine2", "Mythic:MythicWings", [
        maxAbilityLevel,
        maxAbilityLevel,
      ]),
    ])
    expect(options.rankOptions).toEqual([])
    expect(options.progressionOptions).toEqual([])
    expect(options.abilityMin).toBeNull()
  })

  it("offers no ranks without a character", () => {
    expect(bulkTargetOptions([mow]).rankOptions).toEqual([])
  })
})

describe("snapUp", () => {
  it("keeps a value at or above the first option and raises one below it", () => {
    const options = ["Gold1", "Gold2", "Gold3"] as const
    expect(snapUp("Gold2", options, rankIndex)).toBe("Gold2")
    expect(snapUp("Silver1", options, rankIndex)).toBe("Gold1")
    expect(snapUp("Gold2", [], rankIndex)).toBeNull()
  })
})
