import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useMowUpgradeRanges } from "./use-mow-upgrade-ranges"

describe("useMowUpgradeRanges", () => {
  it("starts an owned MoW at its levels, To ten levels on", () => {
    const { result } = renderHook(() =>
      useMowUpgradeRanges({ primary: 30, secondary: 28 }, 60)
    )
    expect(result.current.ranges).toEqual({
      primary: { from: 30, to: 40 },
      secondary: { from: 28, to: 38 },
    })
  })

  it("starts an unowned MoW at level 1", () => {
    const { result } = renderHook(() =>
      useMowUpgradeRanges({ primary: 1, secondary: 1 }, 60)
    )
    expect(result.current.ranges.primary).toEqual({ from: 1, to: 11 })
  })

  it("raises To with From and never sets To below From", () => {
    const { result } = renderHook(() =>
      useMowUpgradeRanges({ primary: 1, secondary: 1 }, 60)
    )
    act(() => result.current.setFrom("primary", 30))
    expect(result.current.ranges.primary).toEqual({ from: 30, to: 30 })
    act(() => result.current.setTo("primary", 20))
    expect(result.current.ranges.primary).toEqual({ from: 30, to: 30 })
    act(() => result.current.setTo("primary", 45))
    expect(result.current.ranges.primary).toEqual({ from: 30, to: 45 })
    expect(result.current.ranges.secondary).toEqual({ from: 1, to: 11 })
  })
})

describe("useMowUpgradeRanges with late player data", () => {
  it("follows the player's levels until the user changes a range", () => {
    const { result, rerender } = renderHook(
      ({ levels }) => useMowUpgradeRanges(levels, 60),
      { initialProps: { levels: { primary: 1, secondary: 1 } } }
    )
    rerender({ levels: { primary: 30, secondary: 28 } })
    expect(result.current.ranges.primary).toEqual({ from: 30, to: 40 })
    act(() => result.current.setTo("secondary", 50))
    rerender({ levels: { primary: 31, secondary: 29 } })
    expect(result.current.ranges).toEqual({
      primary: { from: 31, to: 41 },
      secondary: { from: 28, to: 50 },
    })
  })
})
