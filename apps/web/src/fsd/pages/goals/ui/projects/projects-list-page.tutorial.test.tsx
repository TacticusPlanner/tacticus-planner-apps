import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useProjectsListTutorial } from "./projects-list-page.tutorial"

const register = vi.fn()

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

describe("useProjectsListTutorial", () => {
  it("registers localized desktop and mobile steps targeting the list and the New project FAB", () => {
    renderHook(() => useProjectsListTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string; content: string }[]
      mobile: { target: string; title: string; content: string }[]
    }

    expect(steps.desktop).toEqual(steps.mobile)
    for (const step of steps.desktop) {
      expect(step.target).toMatch(/^\[data-testid="[a-z-]+"\]$/)
      expect(step.title).toContain("localized:tour.projectsList.steps")
      expect(step.content).toContain("localized:tour.projectsList.steps")
    }
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="project-list"]',
      '[data-testid="projects-new-project"]',
    ])
  })

  it("keeps the reworded 'what a project is' step keys on the list step", () => {
    // The step copy was rewritten (locale files) to say what a project is rather than only how the
    // dashboard is arranged; the keys it renders through must stay the ones that were rewritten.
    renderHook(() => useProjectsListTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { title: string; content: string }[]
    }

    expect(steps.desktop[0]).toMatchObject({
      title: "localized:tour.projectsList.steps.list.title",
      content: "localized:tour.projectsList.steps.list.content",
    })
  })
})
