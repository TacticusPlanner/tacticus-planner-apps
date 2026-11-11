// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { useAscensionFields } from "./use-ascension-fields"

describe("useAscensionFields", () => {
  it("starts at the lowest progression when nothing is known about the unit", () => {
    const { result } = renderHook(() => useAscensionFields())

    expect(result.current.state.progressionStart).toBe("Common:None")
    expect(result.current.state.progressionEnd).toBe("Common:OneStar")
  })

  it("starts an unowned unit at its starting rarity, not at Common", () => {
    const { result } = renderHook(() =>
      useAscensionFields(undefined, "Legendary:RedThreeStars")
    )

    expect(result.current.state.progressionStart).toBe(
      "Legendary:RedThreeStars"
    )
    expect(result.current.state.progressionEnd).toBe("Legendary:RedFourStars")
    expect(result.current.state.progressionEndOptions).not.toContain(
      "Epic:RedThreeStars"
    )
  })

  it("prefers the synced progression and falls back again after a reset", () => {
    const { result } = renderHook(() =>
      useAscensionFields(undefined, "Legendary:RedThreeStars")
    )

    act(() => result.current.prefillFrom("Legendary:RedFiveStars"))
    expect(result.current.state.progressionStart).toBe("Legendary:RedFiveStars")

    act(() => result.current.reset())
    expect(result.current.state.progressionStart).toBe(
      "Legendary:RedThreeStars"
    )
  })
})
