import { describe, expect, it, vi } from "vitest"

import { renderHook } from "@/test/render"

import { useShopsBrowseTutorial } from "./shops-browse-page.tutorial"

const register = vi.fn()

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
      expect(step.title).not.toContain("shops.tour.libraryShops.steps")
      expect(step.content).not.toContain("shops.tour.libraryShops.steps")
    }
    expect(steps.desktop.map((step) => step.title)).toEqual([
      "Pick a day",
      "Pick a shop",
      "Random slots",
    ])
    expect(steps.desktop.map((step) => step.content)).toEqual([
      "Choose any day of the week to see what the shops rotate in that day.",
      "Switch between the Guild, Guild War, Crusade, and Rogue Trader shops.",
      "A “N possible rewards” card means the slot is randomized — only one of the listed rewards is actually offered that day.",
    ])

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
