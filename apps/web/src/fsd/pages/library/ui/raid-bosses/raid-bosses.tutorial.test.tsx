import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useRaidBossesTutorial } from "./raid-bosses.tutorial"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({}))

describe("useRaidBossesTutorial", () => {
  it("guides the season-reference landing page on both platforms", () => {
    const { result } = renderHook(() => useRaidBossesTutorial())
    const { desktop, mobile } = result.current
    expect(mobile).toBeDefined()

    for (const set of [desktop, mobile ?? []]) {
      const targets = set.map((step) => step.target)
      expect(targets).toEqual([
        '[data-testid="raid-boss-season-selector"]',
        '[data-testid="raid-boss-season-reference"]',
      ])
      for (const step of set) {
        expect(step.title).toContain("localized:raidBosses.tour.steps")
        expect(step.content).toContain("localized:raidBosses.tour.steps")
      }
    }
  })

  it("guides the detail page including its adjusted-stats area", () => {
    const { result } = renderHook(() => useRaidBossesTutorial(true))
    const { desktop, mobile } = result.current
    expect(mobile).toBeDefined()

    for (const set of [desktop, mobile ?? []]) {
      expect(set.map((step) => step.target)).toEqual([
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
})
