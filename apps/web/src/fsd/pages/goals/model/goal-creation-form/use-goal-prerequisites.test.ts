import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { GoalKind } from "@/entities/goal"

import { useGoalPrerequisites } from ".//use-goal-prerequisites"

function types(...kinds: GoalKind[]): ReadonlySet<GoalKind> {
  return new Set(kinds)
}

const baseParams = {
  abilityActiveEnd: 0,
  abilityPassiveEnd: 0,
}

describe("useGoalPrerequisites", () => {
  it("suggests Unlock when the character is locked and Rank is enabled", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
        ...baseParams,
        isLocked: true,
        currentProgression: undefined,
        enabledTypes: types("Rank"),
        rankEnd: "Gold1",
      })
    )

    expect(result.current.needsUnlock).toBe(true)
  })

  it("does not suggest Unlock when the character already has an explicit Unlock goal toggled", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
        ...baseParams,
        isLocked: true,
        currentProgression: undefined,
        enabledTypes: types("Unlock", "Rank"),
        rankEnd: "Gold1",
      })
    )

    expect(result.current.needsUnlock).toBe(false)
  })

  it("suggests Ascension with the correct start/end when the target rank is unreachable", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
        ...baseParams,
        isLocked: false,
        currentProgression: "Common:None",
        enabledTypes: types("Rank"),
        rankEnd: "Gold1",
      })
    )

    expect(result.current.needsAscension).toEqual({
      start: "Common:None",
      end: "Epic:RedOneStar",
    })
  })

  it("uses the conservative firstProgression baseline for a locked character's Ascension suggestion", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
        ...baseParams,
        isLocked: true,
        currentProgression: undefined,
        enabledTypes: types("Rank"),
        rankEnd: "Gold1",
      })
    )

    expect(result.current.needsAscension).toEqual({
      start: "Common:None",
      end: "Epic:RedOneStar",
    })
  })

  it("does not auto-suggest Ascension once the user has explicitly toggled it", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
        ...baseParams,
        isLocked: false,
        currentProgression: "Common:None",
        enabledTypes: types("Rank", "Ascension"),
        rankEnd: "Gold1",
      })
    )

    expect(result.current.needsAscension).toBeNull()
  })

  it("suggests Ascension when an Ability target exceeds the current rarity's ability cap", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
        ...baseParams,
        isLocked: false,
        currentProgression: "Epic:RedOneStar", // ability cap 35
        enabledTypes: types("Ability"),
        rankEnd: "Gold1",
        abilityActiveEnd: 42,
        abilityPassiveEnd: 10,
      })
    )

    expect(result.current.needsAscension).toEqual({
      start: "Epic:RedOneStar",
      end: "Legendary:RedThreeStars",
    })
    // The character level the target implies is shown on the goal, never suggested as a prerequisite.
    expect(result.current).not.toHaveProperty("needsLevel")
  })

  it("does not suggest Ascension for an Ability target within the current rarity cap", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
        ...baseParams,
        isLocked: false,
        currentProgression: "Legendary:RedThreeStars", // ability cap 50
        enabledTypes: types("Ability"),
        rankEnd: "Gold1",
        abilityActiveEnd: 45,
        abilityPassiveEnd: 45,
      })
    )

    expect(result.current.needsAscension).toBeNull()
  })

  it("does not suggest Ascension for an above-cap Ability target once Ascension is toggled", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
        ...baseParams,
        isLocked: false,
        currentProgression: "Epic:RedOneStar",
        enabledTypes: types("Ability", "Ascension"),
        rankEnd: "Gold1",
        abilityActiveEnd: 42,
        abilityPassiveEnd: 10,
      })
    )

    expect(result.current.needsAscension).toBeNull()
  })

  it("suggests Ascension for a Mow whose Ability target is above the cap", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
        ...baseParams,
        isLocked: false,
        currentProgression: "Epic:RedOneStar",
        enabledTypes: types("Ability"),
        rankEnd: "Gold1",
        abilityActiveEnd: 42,
        abilityPassiveEnd: 10,
      })
    )

    expect(result.current.needsAscension).toEqual({
      start: "Epic:RedOneStar",
      end: "Legendary:RedThreeStars",
    })
  })

  it("suggests neither when the character is owned and the target rank is already reachable", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
        ...baseParams,
        isLocked: false,
        currentProgression: "Epic:RedOneStar",
        enabledTypes: types("Rank"),
        rankEnd: "Gold1",
      })
    )

    expect(result.current.needsUnlock).toBe(false)
    expect(result.current.needsAscension).toBeNull()
  })
})
