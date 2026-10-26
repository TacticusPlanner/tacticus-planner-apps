import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useAbilityFields } from "./use-create-goal-form"

describe("useAbilityFields", () => {
  it("starts at level 0, targeting the first level of each track", () => {
    const { result } = renderHook(() => useAbilityFields())
    expect(result.current.state).toMatchObject({
      abilityActiveStart: 0,
      abilityActiveEnd: 1,
      abilityActiveTarget: 1,
      abilityPassiveStart: 0,
      abilityPassiveEnd: 1,
      abilityPassiveTarget: 1,
    })
  })

  it("skips a target pair an in-flight Ability goal already holds", () => {
    const { result } = renderHook(() => useAbilityFields(new Set(["13:10"])))

    act(() => result.current.prefillFrom(12, 9))

    expect(result.current.state.abilityActiveTarget).toBe(14)
    expect(result.current.state.abilityPassiveTarget).toBe(11)
  })

  it("seeds each track's target from its own current level + 1", () => {
    const { result } = renderHook(() => useAbilityFields())

    act(() => result.current.prefillFrom(12, 9))

    expect(result.current.state).toMatchObject({
      abilityActiveStart: 12,
      abilityActiveTarget: 13,
      abilityActiveEnd: 13,
      abilityPassiveStart: 9,
      abilityPassiveTarget: 10,
      abilityPassiveEnd: 10,
    })
  })

  it("clamps a track already at the maximum ability level", () => {
    const { result } = renderHook(() => useAbilityFields())

    act(() => result.current.prefillFrom(60, 58))

    expect(result.current.state.abilityActiveTarget).toBe(60)
    expect(result.current.state.abilityPassiveTarget).toBe(59)
  })

  it("updates each track's target independently and derives end = max(start, target)", () => {
    const { result } = renderHook(() => useAbilityFields())

    act(() => result.current.prefillFrom(12, 9))
    act(() => result.current.state.setAbilityActiveTarget(20))

    expect(result.current.state.abilityActiveEnd).toBe(20)
    expect(result.current.state.abilityPassiveTarget).toBe(10)
    expect(result.current.state.abilityPassiveEnd).toBe(10)
  })

  it("keeps a track static when its target is left at or below its current level", () => {
    const { result } = renderHook(() => useAbilityFields())

    act(() => result.current.prefillFrom(12, 9))
    act(() => result.current.state.setAbilityPassiveTarget(9))

    expect(result.current.state.abilityPassiveEnd).toBe(9)
    expect(result.current.state.abilityActiveEnd).toBe(13)
  })

  it("clears every field on reset", () => {
    const { result } = renderHook(() => useAbilityFields())

    act(() => result.current.prefillFrom(12, 9))
    act(() => result.current.state.setAbilityActiveTarget(20))
    act(() => result.current.reset())

    expect(result.current.state).toMatchObject({
      abilityActiveStart: 0,
      abilityActiveTarget: 1,
      abilityPassiveStart: 0,
      abilityPassiveTarget: 1,
    })
  })
})
