import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useRaidBossesTutorial } from "./raid-bosses.tutorial"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({}))

describe("useRaidBossesTutorial", () => {
  it("covers the detail view on both platforms", () => {
    const { result } = renderHook(() => useRaidBossesTutorial("details"))

    for (const set of [result.current.desktop, result.current.mobile ?? []]) {
      expect(set.map((step) => step.target)).toEqual([
        '[data-testid="raid-boss-tabs"]',
        '[data-testid="raid-boss-list-bosses"]',
        '[data-testid="raid-boss-list-primes"]',
        '[data-testid="raid-boss-progression"]',
        '[data-testid="raid-boss-prime-modifiers"]',
        '[data-testid="raid-boss-adjusted-stats"]',
      ])
      for (const step of set) {
        expect(step.title).toContain("localized:raidBosses.tour.steps")
        expect(step.content).toContain("localized:raidBosses.tour.steps")
      }
    }
  })

  it("guides the season-reference landing page", () => {
    const { result } = renderHook(() => useRaidBossesTutorial("seasons", false))

    expect(result.current.desktop.map((step) => step.target)).toEqual([
      '[data-testid="raid-boss-tabs"]',
      '[data-testid="raid-boss-season-reference"]',
    ])
  })

  it.each([
    [
      "seasons",
      ["raid-boss-tabs", "raid-boss-season-select", "raid-boss-season-content"],
    ],
    [
      "meta",
      [
        "raid-boss-tabs",
        "raid-boss-meta-recommendations",
        "raid-boss-meta-filter",
        "raid-boss-meta-comps",
      ],
    ],
  ] as const)("targets the active %s tab", (tab, testIds) => {
    const { result } = renderHook(() => useRaidBossesTutorial(tab))

    for (const set of [result.current.desktop, result.current.mobile ?? []]) {
      expect(set.map((step) => step.target)).toEqual(
        testIds.map((testId) => `[data-testid="${testId}"]`)
      )
    }
  })
})
