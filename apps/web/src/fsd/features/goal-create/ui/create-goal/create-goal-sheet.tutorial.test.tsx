import { renderHook } from "@/test/render"
import { describe, expect, it, vi } from "vitest"

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

      expect(result.current[viewport]).toHaveLength(3)
      const [step, mythicStep, projectStep] = result.current[viewport] ?? []
      if (!step || !mythicStep || !projectStep) throw new Error("missing steps")
      expect(step.target).toBe(
        '[data-testid="create-goal-acquisition-sources"]'
      )
      expect(step.title).toBe("Acquisition sources")
      expect(step.content).toBe(
        "Combine campaign farming, Onslaught, and daily shops — select any mix to lower this goal's estimated time."
      )
      expect(mythicStep.target).toBe(
        '[data-testid="goal-mythic-material-sources"]'
      )
      expect(mythicStep.title).toBe("Mythic materials")
      expect(mythicStep.content).toBe(
        "Shop offers for the Mythic materials this goal needs. Every available offer is counted by default; uncheck any you won't buy."
      )
      expect(projectStep.target).toBe('[data-testid="create-goal-projects"]')
      expect(projectStep.title).toBe("Projects")
      expect(projectStep.content).toBe(
        "Search for a project name that doesn't exist yet and choose Create to add it here without leaving this form. Which projects hold the goal never changes its status or priority."
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
