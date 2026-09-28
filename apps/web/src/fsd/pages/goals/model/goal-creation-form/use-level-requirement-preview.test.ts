import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { GoalKind } from "@/entities/goal"

import { useLevelRequirementPreviews } from ".//use-level-requirement-preview"

function types(...kinds: GoalKind[]): ReadonlySet<GoalKind> {
  return new Set(kinds)
}

const base = {
  entityType: "Character" as const,
  rankEnd: "Gold1" as const, // rankToLevel[Gold1] = 35
  rankAdditionalTarget: "None" as const,
  abilityActiveEnd: 0,
  abilityPassiveEnd: 0,
  currentLevel: 20,
  currentXp: 5_600,
  inventoryXpBooks: undefined,
}

describe("useLevelRequirementPreviews", () => {
  it("shows a Rank target's required level, current level, and raw XP gap", () => {
    const { result } = renderHook(() =>
      useLevelRequirementPreviews({ ...base, enabledTypes: types("Rank") })
    )

    // Level 35's total-XP threshold is 200,200 (levelXp table); 5,600 gained.
    expect(result.current.Rank).toMatchObject({
      requiredLevel: 35,
      currentLevel: 20,
      remainingXp: 200_200 - 5_600,
    })
    expect(result.current.Ability).toBeUndefined()
  })

  it("derives an Ability target's requirement from its higher track, separate from Rank's", () => {
    const { result } = renderHook(() =>
      useLevelRequirementPreviews({
        ...base,
        enabledTypes: types("Rank", "Ability"),
        abilityActiveEnd: 40,
        abilityPassiveEnd: 10,
      })
    )

    expect(result.current.Rank?.requiredLevel).toBe(35)
    expect(result.current.Ability?.requiredLevel).toBe(40)
  })

  it("nets the books and gold against owned XP books, dropping the cost once fully covered", () => {
    const uncovered = renderHook(() =>
      useLevelRequirementPreviews({
        ...base,
        enabledTypes: types("Rank"),
        currentLevel: 34,
        currentXp: 157_200,
      })
    )
    expect(uncovered.result.current.Rank?.cost).toMatchObject({ books: 4 })

    const covered = renderHook(() =>
      useLevelRequirementPreviews({
        ...base,
        enabledTypes: types("Rank"),
        currentLevel: 34,
        currentXp: 157_200,
        inventoryXpBooks: [{ xpBookId: "xpLegendary", amount: 10 }],
      })
    )
    expect(covered.result.current.Rank).toBeDefined()
    expect(covered.result.current.Rank?.cost).toBeNull()
  })

  it("shows nothing once the level is sufficient, for a Mow, or when the kind isn't enabled", () => {
    expect(
      renderHook(() =>
        useLevelRequirementPreviews({
          ...base,
          enabledTypes: types("Rank"),
          currentLevel: 35,
        })
      ).result.current
    ).toEqual({ Rank: undefined, Ability: undefined })
    expect(
      renderHook(() =>
        useLevelRequirementPreviews({
          ...base,
          entityType: "Mow",
          enabledTypes: types("Ability"),
          abilityActiveEnd: 40,
        })
      ).result.current
    ).toEqual({})
    expect(
      renderHook(() =>
        useLevelRequirementPreviews({ ...base, enabledTypes: types("Unlock") })
      ).result.current
    ).toEqual({ Rank: undefined, Ability: undefined })
  })

  it("assumes a freshly-unlocked level 1 with no XP for a character not in the roster", () => {
    const { result } = renderHook(() =>
      useLevelRequirementPreviews({
        ...base,
        enabledTypes: types("Rank"),
        currentLevel: undefined,
        currentXp: undefined,
      })
    )

    expect(result.current.Rank).toMatchObject({
      requiredLevel: 35,
      currentLevel: 1,
      remainingXp: 200_200,
    })
  })
})
