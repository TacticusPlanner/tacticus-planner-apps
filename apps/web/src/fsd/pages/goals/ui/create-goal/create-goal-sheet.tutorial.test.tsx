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
  it("registers the same localized steps for desktop and mobile, targeting the sources and project pickers", () => {
    const { result } = renderHook(() => useCreateGoalSheetTutorial())

    expect(result.current.desktop).toEqual(result.current.mobile)
    expect(result.current.desktop).toHaveLength(2)
    const [step, projectStep] = result.current.desktop
    expect(step.target).toBe('[data-testid="create-goal-acquisition-sources"]')
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
