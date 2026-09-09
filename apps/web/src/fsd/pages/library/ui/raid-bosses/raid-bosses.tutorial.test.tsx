import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useRaidBossesTutorial } from "./raid-bosses.tutorial"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({}))

describe("useRaidBossesTutorial", () => {
  it("covers both platforms with steps targeting the page's testids, including the adjusted-stats area", () => {
    const { result } = renderHook(() => useRaidBossesTutorial())
    const { desktop, mobile } = result.current
    expect(mobile).toBeDefined()

    for (const set of [desktop, mobile ?? []]) {
      const targets = set.map((step) => step.target)
      expect(targets).toEqual([
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
