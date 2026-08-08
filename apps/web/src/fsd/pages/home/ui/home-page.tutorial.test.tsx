import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useHomePageTutorial } from "./home-page.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

describe("useHomePageTutorial", () => {
  it("registers identical, localized desktop and mobile steps targeting the title, navigation, and calendar", () => {
    renderHook(() => useHomePageTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string; content: string }[]
      mobile: { target: string; title: string; content: string }[]
    }

    expect(steps.desktop).toEqual(steps.mobile)
    for (const step of steps.desktop) {
      expect(step.target).toMatch(/^\[data-testid="[a-z-]+"\]$/)
      expect(step.title).toContain("localized:tour.home.steps")
      expect(step.content).toContain("localized:tour.home.steps")
    }
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="home-page-title"]',
      '[data-testid="events-calendar-navigation"]',
      '[data-testid="events-calendar"]',
    ])
  })
})
