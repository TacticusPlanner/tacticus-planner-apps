import { describe, expect, it } from "vitest"
import { Rank } from "@workspace/game-domain"

import { getGoalValidationIssue } from "./goal-validation"

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
})
