import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useProjectDetailTutorial } from "./project-detail-page.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

describe("useProjectDetailTutorial", () => {
  it("registers localized steps targeting the header, unit ordering, selector, and goals", () => {
    renderHook(() => useProjectDetailTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string; content: string }[]
      mobile: { target: string; title: string; content: string }[]
    }

    expect(steps.desktop).toEqual(steps.mobile)
    for (const step of steps.desktop) {
      expect(step.title).toContain("localized:tour.projectDetail.steps")
      expect(step.content).toContain("localized:tour.projectDetail.steps")
    }
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="project-detail-header"]',
      '[data-testid="project-reprioritize-units"]',
      '[data-testid="projects-goal-project-select"]',
      '[data-testid="project-detail-goals"]',
    ])
  })
})
