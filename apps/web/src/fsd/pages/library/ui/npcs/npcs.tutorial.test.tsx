import { describe, expect, it } from "vitest"

import { renderHook } from "@/test/render"

import { useNpcsTutorial } from "./npcs.tutorial"

describe("useNpcsTutorial", () => {
  it("targets the desktop filter bar, list, selectors, and stats", () => {
    const { result } = renderHook(() => useNpcsTutorial())

    expect(result.current.desktop.map((step) => step.target)).toEqual([
      '[data-testid="npcs-filter-panel"]',
      '[data-testid="npcs-list"]',
      '[data-testid="npcs-variation-select"]',
      '[data-testid="npcs-level-select"]',
      '[data-testid="npcs-stats"]',
    ])
    expect(result.current.desktop[0]?.title).toBe("Filter the roster")
  })

  it("targets the mobile combobox, selectors, and stats", () => {
    const { result } = renderHook(() => useNpcsTutorial())

    expect(result.current.mobile?.map((step) => step.target)).toEqual([
      '[data-testid="npcs-combobox"]',
      '[data-testid="npcs-variation-select"]',
      '[data-testid="npcs-level-select"]',
      '[data-testid="npcs-stats"]',
    ])
    expect(result.current.mobile?.[0]?.content).toBe(
      "Open the picker and search for a unit. Variations of the same unit are grouped under one entry."
    )
  })
})
