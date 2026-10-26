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
    "%s steps target the milestones, sources and project pickers inside the dialog or sheet body",
    (viewport) => {
      const { result } = renderHook(() => useCreateGoalSheetTutorial())

      expect(result.current[viewport]).toHaveLength(6)
      const [
        statusStep,
        milestoneStep,
        step,
        mythicStep,
        projectStep,
        issueStep,
      ] = result.current[viewport] ?? []
      if (
        !statusStep ||
        !milestoneStep ||
        !step ||
        !mythicStep ||
        !projectStep ||
        !issueStep
      )
        throw new Error("missing steps")
      expect(statusStep.target).toBe(
        viewport === "mobile"
          ? '[data-testid="create-goal-unit-status-summary"]'
          : '[data-testid="create-goal-unit-info"]'
      )
      expect(statusStep.title).toBe("Current status")
      expect(issueStep.target).toBe('[data-testid="create-goal-issue-summary"]')
      expect(issueStep.title).toBe("Problems to fix")
      expect(milestoneStep.target).toBe(
        '[data-testid="create-goal-rank-milestones"], [data-testid="create-goal-ascension-milestones"], [data-testid="create-goal-ability-milestones"]'
      )
      expect(milestoneStep.title).toBe("Milestones")
      expect(milestoneStep.content).toBe(
        "Add milestone to plan several targets for this unit at once, such as Gold 1, then Diamond 1, then Diamond 3. Each becomes its own goal, after the one before it."
      )
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

  it("shares every step across viewports but the status one", () => {
    const { result } = renderHook(() => useCreateGoalSheetTutorial())

    expect(result.current.desktop?.slice(1)).toEqual(
      result.current.mobile?.slice(1)
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
