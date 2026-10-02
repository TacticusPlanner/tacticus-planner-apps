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
  GoalEditDialogTourRegistration,
  useGoalEditDialogTutorial,
} from "./goal-edit-dialog.tutorial"

describe("useGoalEditDialogTutorial", () => {
  it.each(["desktop", "mobile"] as const)(
    "%s steps target the target, priority and project fields inside the dialog or sheet body",
    (viewport) => {
      const { result } = renderHook(() => useGoalEditDialogTutorial())

      const steps = result.current[viewport] ?? []
      expect(steps.map((step) => step.target)).toEqual([
        '[data-testid="goal-edit-target"]',
        '[data-testid="goal-edit-priority"]',
        '[data-testid="goal-edit-projects"]',
        '[data-testid="goal-mythic-material-sources"]',
      ])
      expect(steps.map((step) => [step.title, step.content])).toEqual(
        ["target", "priority", "projects", "mythicMaterialSources"].map(
          (name) => [
            `localized:tour.editGoal.steps.${name}.title`,
            `localized:tour.editGoal.steps.${name}.content`,
          ]
        )
      )
    }
  )

  it("shares the same steps across viewports", () => {
    const { result } = renderHook(() => useGoalEditDialogTutorial())

    expect(result.current.desktop).toEqual(result.current.mobile)
  })
})

describe("GoalEditDialogTourRegistration", () => {
  it("registers the tutorial's steps via useTourPageSteps", () => {
    renderHook(() => GoalEditDialogTourRegistration())

    expect(register).toHaveBeenCalledWith(
      expect.objectContaining({ desktop: expect.any(Array) })
    )
  })
})
