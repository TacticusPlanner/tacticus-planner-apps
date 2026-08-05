import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useGoalsOverviewTutorial } from "./goals-page.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

describe("useGoalsOverviewTutorial", () => {
  it("registers localized desktop and mobile steps targeting the consolidated row", () => {
    renderHook(() => useGoalsOverviewTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string; content: string }[]
      mobile: { target: string; title: string; content: string }[]
    }

    expect(steps.desktop).toEqual(steps.mobile)
    expect(steps.desktop.length).toBeGreaterThanOrEqual(3)
    for (const step of steps.desktop) {
      expect(step.target).toMatch(/^\[data-testid="[a-z-]+"\]$/)
      expect(step.title).toContain("localized:tour.overview.steps")
      expect(step.content).toContain("localized:tour.overview.steps")
    }
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="goals-status-filter"]',
      '[data-testid="goals-type-filter"]',
      '[data-testid="goals-planning-settings"]',
      '[data-testid="goals-page"]',
    ])
  })
})
