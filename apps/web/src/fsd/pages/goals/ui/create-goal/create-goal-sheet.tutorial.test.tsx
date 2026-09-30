import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useTranslation: () => ({ t: (key: string) => `localized:${key}` }),
}))

const register = vi.fn()
vi.mock("@/shared/tour", () => ({
  useTourPageSteps: (steps: unknown) => register(steps),
}))

import {
  CreateGoalSheetTourRegistration,
  useCreateGoalSheetTutorial,
} from "./create-goal-sheet.tutorial"

describe("useCreateGoalSheetTutorial", () => {
  it.each(["desktop", "mobile"] as const)(
    "%s steps target the sources and project pickers inside the dialog or sheet body",
    (viewport) => {
      const { result } = renderHook(() => useCreateGoalSheetTutorial())

      expect(result.current[viewport]).toHaveLength(2)
      const [step, projectStep] = result.current[viewport] ?? []
      expect(step.target).toBe(
        '[data-testid="create-goal-acquisition-sources"]'
      )
      expect(step.title).toBe(
        "localized:tour.createGoal.steps.acquisitionSources.title"
      )
      expect(step.content).toBe(
        "localized:tour.createGoal.steps.acquisitionSources.content"
      )
      expect(projectStep.target).toBe('[data-testid="create-goal-projects"]')
      expect(projectStep.title).toBe(
        "localized:tour.createGoal.steps.projects.title"
      )
      expect(projectStep.content).toBe(
        "localized:tour.createGoal.steps.projects.content"
      )
    }
  )

  it("shares the same steps across viewports", () => {
    const { result } = renderHook(() => useCreateGoalSheetTutorial())

    expect(result.current.desktop).toEqual(result.current.mobile)
  })
})

describe("CreateGoalSheetTourRegistration", () => {
  it("registers the tutorial's steps via useTourPageSteps", () => {
    renderHook(() => CreateGoalSheetTourRegistration())

    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({ desktop: expect.any(Array) })
    )
  })
})
