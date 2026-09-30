import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useScheduleTutorial } from "./schedule-page.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

describe("Schedule tutorial", () => {
  it("registers localized desktop and mobile steps over the summary and the days", () => {
    renderHook(() => useScheduleTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string; content: string }[]
      mobile: { target: string; title: string; content: string }[]
    }

    expect(steps.desktop).toEqual(steps.mobile)
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="plan-summary"]',
      '[data-testid="plan-unit-filter"]',
      '[data-testid="plan-days"]',
    ])
    for (const step of steps.desktop) {
      expect(step.title).toContain("localized:tour.raidsPlan.steps")
      expect(step.content).toContain("localized:tour.raidsPlan.steps")
    }
  })
})
