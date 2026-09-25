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
  it("registers localized desktop and mobile steps covering assembly and the row menu", () => {
    renderHook(() => useProjectDetailTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { target: string; title: string; content: string }[]
      mobile: { target: string; title: string; content: string }[]
    }

    for (const step of [...steps.desktop, ...steps.mobile]) {
      expect(step.title).toContain("localized:tour.projectDetail.steps")
      expect(step.content).toContain("localized:tour.projectDetail.steps")
    }
    expect(steps.desktop.map((step) => step.target)).toEqual([
      '[data-testid="project-detail-header"]',
      '[data-testid="project-add-goals"]',
      '[data-testid="project-create-goal"]',
      '[data-testid="goal-row-drag-handle"]',
      '[data-testid="projects-goal-project-select"]',
      '[data-testid="project-detail-goals"]',
      '[data-testid="goal-row-actions"]',
    ])
    // Desktop shows a drag handle on every row directly; mobile has a dedicated reorder-mode
    // toggle instead — the reprioritize step's target differs, every other step matches.
    expect(steps.mobile.map((step) => step.target)).toEqual([
      '[data-testid="project-detail-header"]',
      '[data-testid="project-add-goals"]',
      '[data-testid="project-create-goal"]',
      '[data-testid="project-mobile-reorder-toggle"]',
      '[data-testid="projects-goal-project-select"]',
      '[data-testid="project-detail-goals"]',
      '[data-testid="goal-row-actions"]',
    ])
    expect(
      steps.desktop.map((step) => `${step.title} ${step.content}`).join(" ")
    ).toContain("tour.projectDetail.steps.rowActions")
  })

  it("keeps the reworded header step keys, which now say the project holds a selection of goals", () => {
    renderHook(() => useProjectDetailTutorial())
    const steps = register.mock.lastCall?.[0] as {
      desktop: { title: string; content: string }[]
    }

    expect(steps.desktop[0]).toMatchObject({
      title: "localized:tour.projectDetail.steps.header.title",
      content: "localized:tour.projectDetail.steps.header.content",
    })
  })
})
