import { describe, expect, it, vi } from "vitest"

import { renderHook } from "@/test/render"

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
        '[data-testid="goal-card-target"]',
        '[data-testid="goal-edit-priority"]',
        '[data-testid="goal-edit-projects"]',
        '[data-testid="goal-mythic-material-sources"]',
      ])
      expect(steps.map((step) => [step.title, step.content])).toEqual([
        [
          "Target",
          "Pick where this goal ends on the ladder or the level stepper. It keeps its history, and your plan recalculates when you save.",
        ],
        [
          "Priority",
          "Pick this goal's position in your priority order. It moves there when you save, and the goals in between shift by one place.",
        ],
        [
          "Projects",
          "Add this goal to a project, or create a new one from the picker. The new project is saved right away; the goal itself only changes when you save.",
        ],
        [
          "Mythic materials",
          "Choose which shop offers supply this goal's Mythic materials. Unchecking every offer stops counting on shops for them.",
        ],
      ])
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
