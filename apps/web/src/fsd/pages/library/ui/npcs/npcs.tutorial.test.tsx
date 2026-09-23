import { describe, expect, it, vi } from "vitest"
import { renderHook } from "@testing-library/react"

import { useNpcsTutorial } from "./npcs.tutorial"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

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
    expect(result.current.desktop[0].title).toBe(
      "npcs.tour.steps.filters.title"
    )
  })

  it("targets the mobile combobox, selectors, and stats", () => {
    const { result } = renderHook(() => useNpcsTutorial())

    expect(result.current.mobile?.map((step) => step.target)).toEqual([
      '[data-testid="npcs-combobox"]',
      '[data-testid="npcs-variation-select"]',
      '[data-testid="npcs-level-select"]',
      '[data-testid="npcs-stats"]',
    ])
    expect(result.current.mobile?.[0].content).toBe(
      "npcs.tour.steps.picker.content"
    )
  })
})
