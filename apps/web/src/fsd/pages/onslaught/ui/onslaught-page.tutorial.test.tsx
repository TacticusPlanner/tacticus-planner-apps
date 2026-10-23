import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useOnslaughtTutorial } from "./onslaught-page.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

type Steps = {
  desktop: { target: string; title: string; content: string }[]
  mobile: { target: string; title: string; content: string }[]
}
const lastSteps = () => register.mock.lastCall?.[0] as Steps

// Whether each target exists on the rendered page, on desktop and mobile, is asserted in
// onslaught-page.test.tsx ("tour"); this file covers how the steps are composed.
describe("useOnslaughtTutorial", () => {
  it("registers localized desktop and mobile steps for the cards and the save bar", () => {
    renderHook(() => useOnslaughtTutorial())
    const steps = lastSteps()
    for (const step of [...steps.desktop, ...steps.mobile]) {
      expect(step.title).toContain("localized:tour.onslaught.steps")
      expect(step.content).toContain("localized:tour.onslaught.steps")
    }
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="onslaught-alliance-cards"]',
      '[data-testid="onslaught-progress-help"]',
    ])
    expect(steps.mobile.map((step) => step.target)).toEqual([
      '[data-testid="imperial-onslaught-card"]',
      '[data-testid="onslaught-progress-help"]',
    ])
  })
})
