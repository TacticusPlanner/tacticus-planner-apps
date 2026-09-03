import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useShopsTutorial } from "./shops-page.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

describe("useShopsTutorial", () => {
  it("registers identical, localized desktop and mobile steps for the page, guaranteed group, and possible group", () => {
    renderHook(() => useShopsTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string; content: string }[]
      mobile: { target: string; title: string; content: string }[]
    }

    expect(steps.desktop).toEqual(steps.mobile)
    expect(steps.desktop).toHaveLength(3)
    for (const step of steps.desktop) {
      expect(step.target).toMatch(/^\[data-testid="[a-z-]+"\]$/)
      expect(step.title).toContain("localized:tour.shops.steps")
      expect(step.content).toContain("localized:tour.shops.steps")
    }
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="shops-page"]',
      '[data-testid="shop-group-guaranteed"]',
      '[data-testid="shop-group-possible"]',
    ])
  })
})
