import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useProjectsListTutorial } from "./projects-list-page.tutorial"

const register = vi.fn()

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
      expect(step.title).not.toMatch(/tour\.projectsList/)
      expect(step.content).not.toMatch(/tour\.projectsList/)
    }
    expect(steps.desktop.map((step) => step.title)).toEqual([
      "What a project is",
      "Create a project",
    ])
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
      title: "What a project is",
      content:
        "A project is a named selection of your goals — keep several to group different things. The Default project is listed first; a project does not pause or resume anything or change your priorities.",
    })
  })
})
