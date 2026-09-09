import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useRaidBossesTutorial } from "./raid-bosses.tutorial"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({}))

describe("useRaidBossesTutorial", () => {
  it("covers both platforms with steps targeting the page's testids, including the adjusted-stats area", () => {
    const { result } = renderHook(() => useRaidBossesTutorial("details"))
    const { desktop, mobile } = result.current
    expect(mobile).toBeDefined()

    for (const set of [desktop, mobile ?? []]) {
      const targets = set.map((step) => step.target)
      expect(targets).toEqual([
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
  ] as const)("targets only the active %s tab", (tab, testIds) => {
    const { result } = renderHook(() => useRaidBossesTutorial(tab))

    for (const set of [result.current.desktop, result.current.mobile ?? []]) {
      expect(set.map((step) => step.target)).toEqual(
        testIds.map((testId) => `[data-testid="${testId}"]`)
      )
    }
  })
})
