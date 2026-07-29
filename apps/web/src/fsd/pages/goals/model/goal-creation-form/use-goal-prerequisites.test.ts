import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { GoalKind } from "@/entities/goal"

import { useGoalPrerequisites } from ".//use-goal-prerequisites"

function types(...kinds: GoalKind[]): ReadonlySet<GoalKind> {
  return new Set(kinds)
}

const baseParams = {
  entityType: "Character" as const,
  rankAdditionalTarget: "None" as const,
  abilityActiveEnd: 0,
  abilityPassiveEnd: 0,
  currentLevel: undefined,
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

  it("suggests Level when a Rank target implies a level beyond the current one", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
        ...baseParams,
        isLocked: false,
        currentProgression: "Epic:RedOneStar",
        currentLevel: 20,
        enabledTypes: types("Rank"),
        rankEnd: "Gold1", // rankToLevel[Gold1] = 35
      })
    )

    expect(result.current.needsLevel).toEqual({ start: 20, end: 35 })
  })

  it("suggests Level from an Ability target's own level, taking the higher of Rank/Ability when both are enabled", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
        ...baseParams,
        isLocked: false,
        currentProgression: "Epic:RedOneStar",
        currentLevel: 20,
        enabledTypes: types("Rank", "Ability"),
        rankEnd: "Gold1", // implies level 35
        abilityActiveEnd: 40,
        abilityPassiveEnd: 10,
      })
    )

    expect(result.current.needsLevel).toEqual({ start: 20, end: 40 })
  })

  it("does not suggest Level once the target is already reachable at the current level", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
        ...baseParams,
        isLocked: false,
        currentProgression: "Epic:RedOneStar",
        currentLevel: 35,
        enabledTypes: types("Rank"),
        rankEnd: "Gold1",
      })
    )

    expect(result.current.needsLevel).toBeNull()
  })

  it("does not auto-suggest Level once the user has explicitly toggled it, or for a Mow", () => {
    const explicit = renderHook(() =>
      useGoalPrerequisites({
        ...baseParams,
        isLocked: false,
        currentProgression: "Epic:RedOneStar",
        currentLevel: 20,
        enabledTypes: types("Rank", "Level"),
        rankEnd: "Gold1",
      })
    )
    expect(explicit.result.current.needsLevel).toBeNull()

    const mow = renderHook(() =>
      useGoalPrerequisites({
        ...baseParams,
        entityType: "Mow",
        isLocked: false,
        currentProgression: "Epic:RedOneStar",
        currentLevel: 20,
        enabledTypes: types("Ability"),
        rankEnd: "Gold1",
        abilityActiveEnd: 40,
        abilityPassiveEnd: 10,
      })
    )
    expect(mow.result.current.needsLevel).toBeNull()
  })

  it("assumes the lowest possible starting level (1) for a locked character's Level suggestion", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
        ...baseParams,
        isLocked: true,
        currentProgression: undefined,
        currentLevel: undefined,
        enabledTypes: types("Rank"),
        rankEnd: "Gold1",
      })
    )

    expect(result.current.needsLevel).toEqual({ start: 1, end: 35 })
  })
})
