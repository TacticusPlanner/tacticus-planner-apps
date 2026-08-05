import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useProjectsTutorial } from "./projects-page.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

describe("useProjectsTutorial", () => {
  it("registers localized desktop and mobile steps targeting the project list and selector", () => {
    renderHook(() => useProjectsTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string; content: string }[]
      mobile: { target: string; title: string; content: string }[]
    }

    expect(steps.desktop).toEqual(steps.mobile)
    expect(steps.desktop.length).toBeGreaterThanOrEqual(3)
    for (const step of steps.desktop) {
      expect(step.target).toMatch(/^\[data-testid="[a-z-]+"\]$/)
      expect(step.title).toContain("localized:tour.projects.steps")
      expect(step.content).toContain("localized:tour.projects.steps")
    }
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="project-list"]',
      '[data-testid="projects-new-project"]',
      '[data-testid="projects-goal-project-select"]',
      '[data-testid="projects-page"]',
    ])
  })
})
