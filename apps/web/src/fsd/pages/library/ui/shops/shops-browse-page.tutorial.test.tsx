import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useShopsBrowseTutorial } from "./shops-browse-page.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

describe("useShopsBrowseTutorial", () => {
  it("registers localized day/shop/random steps, targeting the viewport-specific controls", () => {
    renderHook(() => useShopsBrowseTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string; content: string }[]
      mobile: { target: string; title: string; content: string }[]
    }

    expect(steps.desktop).toHaveLength(3)
    expect(steps.mobile).toHaveLength(3)

    for (const step of [...steps.desktop, ...steps.mobile]) {
      expect(step.target).toMatch(/^\[data-testid="[a-z0-9-]+"\]$/)
      expect(step.title).toContain("localized:shops.tour.libraryShops.steps")
      expect(step.content).toContain("localized:shops.tour.libraryShops.steps")
    }

    // The controls differ per viewport (segmented toggles vs. dropdowns); the copy is shared.
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="shops-day-toggle"]',
      '[data-testid="shops-shop-toggle"]',
      '[data-testid="shop-slot-0"]',
    ])
    expect(steps.mobile.map((step) => step.target)).toEqual([
      '[data-testid="shops-day-select"]',
      '[data-testid="shops-shop-select"]',
      '[data-testid="shop-slot-0"]',
    ])
    expect(steps.desktop.map((step) => step.title)).toEqual(
      steps.mobile.map((step) => step.title)
    )
  })
})
