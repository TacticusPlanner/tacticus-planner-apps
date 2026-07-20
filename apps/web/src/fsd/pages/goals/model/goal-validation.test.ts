import { describe, expect, it } from "vitest"
import { Rank, lastRank } from "@workspace/game-domain"

import {
  getGoalValidationIssue,
  isAtMaxAbility,
  isAtMaxLevel,
  isAtMaxProgression,
  isAtMaxRank,
  MAX_CHARACTER_LEVEL,
} from "./goal-validation"

const base = {
  hasEntityId: true,
  enabledTypes: new Set(["Ability"] as const),
  isOwned: true,
  currentRank: Rank.Silver1,
  rankEnd: Rank.Silver2,
  currentProgression: "Rare:FourStars" as const,
  progressionEnd: "Rare:FiveStars" as const,
  abilityActiveStart: 20,
  abilityActiveEnd: 21,
  abilityPassiveStart: 18,
  abilityPassiveEnd: 18,
  currentActiveAbility: 20,
  currentPassiveAbility: 18,
  currentLevel: 31,
  levelEnd: 42,
}

describe("getGoalValidationIssue", () => {
  it("accepts an ability goal when either track advances", () => {
    expect(getGoalValidationIssue(base)).toBeNull()
  })

  it("rejects inverted and already-achieved ability ranges", () => {
    expect(getGoalValidationIssue({ ...base, abilityActiveEnd: 19 })).toBe(
      "abilityRange"
    )
    expect(
      getGoalValidationIssue({
        ...base,
        abilityActiveEnd: 20,
        abilityPassiveEnd: 18,
      })
    ).toBe("abilityRange")
  })

  it("rejects owned unlocks and reached rank targets", () => {
    expect(
      getGoalValidationIssue({
        ...base,
        enabledTypes: new Set(["Unlock"] as const),
      })
    ).toBe("alreadyUnlocked")
    expect(
      getGoalValidationIssue({
        ...base,
        enabledTypes: new Set(["Rank"] as const),
        rankEnd: Rank.Silver1,
      })
    ).toBe("rankAlreadyReached")
  })

  it("rejects an already-reached level target, accepts one above the current level", () => {
    expect(
      getGoalValidationIssue({
        ...base,
        enabledTypes: new Set(["Level"] as const),
        levelEnd: 31,
      })
    ).toBe("levelAlreadyReached")
    expect(
      getGoalValidationIssue({
        ...base,
        enabledTypes: new Set(["Level"] as const),
        levelEnd: 42,
      })
    ).toBeNull()
  })
})

describe("isAtMaxRank", () => {
  it("is false for undefined or a non-max rank, true at the last rank", () => {
    expect(isAtMaxRank(undefined)).toBe(false)
    expect(isAtMaxRank(Rank.Silver1)).toBe(false)
    expect(isAtMaxRank(lastRank)).toBe(true)
  })
})

describe("isAtMaxProgression", () => {
  it("is false for undefined or a non-max progression, true at the last step", () => {
    expect(isAtMaxProgression(undefined)).toBe(false)
    expect(isAtMaxProgression("Rare:FourStars")).toBe(false)
    expect(isAtMaxProgression("Mythic:MythicWings")).toBe(true)
  })
})

describe("isAtMaxAbility", () => {
  it("is false without progression data", () => {
    expect(isAtMaxAbility(undefined, 60, 60)).toBe(false)
  })

  it("is false when either track still has room under the current rarity's cap", () => {
    expect(isAtMaxAbility("Legendary:RedThreeStars", 50, 40)).toBe(false)
  })

  it("is true only once both tracks reach the current rarity's cap", () => {
    expect(isAtMaxAbility("Legendary:RedThreeStars", 50, 50)).toBe(true)
    // Mythic's cap (60) is higher than Legendary's (50) — not maxed yet at the Legendary cap.
    expect(isAtMaxAbility("Mythic:OneBlueStar", 50, 50)).toBe(false)
    expect(isAtMaxAbility("Mythic:OneBlueStar", 60, 60)).toBe(true)
  })
})

describe("isAtMaxLevel", () => {
  it("is false for undefined or a below-cap level, true at the level cap", () => {
    expect(isAtMaxLevel(undefined)).toBe(false)
    expect(isAtMaxLevel(31)).toBe(false)
    expect(isAtMaxLevel(MAX_CHARACTER_LEVEL)).toBe(true)
  })
})
