import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { GoalKind } from "@/entities/goal"

import { useGoalPrerequisites } from "./use-goal-prerequisites"

function types(...kinds: GoalKind[]): ReadonlySet<GoalKind> {
  return new Set(kinds)
}

describe("useGoalPrerequisites", () => {
  it("suggests Unlock when the character is locked and Rank is enabled", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
        isLocked: true,
        currentProgression: undefined,
        enabledTypes: types("Rank"),
        rankEnd: "Gold1",
      })
    )

    expect(result.current.needsUnlock).toBe(true)
  })

  it("does not suggest Unlock for a locked character when only Shards is enabled", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
        isLocked: true,
        currentProgression: undefined,
        enabledTypes: types("Shards"),
        rankEnd: "Gold1",
      })
    )

    expect(result.current.needsUnlock).toBe(false)
  })

  it("does not suggest Unlock when the character already has an explicit Unlock goal toggled", () => {
    const { result } = renderHook(() =>
      useGoalPrerequisites({
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
