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

const testId = (id: string) => `[data-testid="${id}"]`
const ladder = `${testId("create-goal-rank-end")}, ${testId("create-goal-ascension-end")}`
const milestones = ["rank", "ascension", "ability"]
  .map((kind) => testId(`create-goal-${kind}-milestones`))
  .join(", ")

describe("useCreateGoalSheetTutorial", () => {
  it("desktop steps target the status, ladder, milestones, sources, projects and problem count", () => {
    const { result } = renderHook(() => useCreateGoalSheetTutorial())

    expect(result.current.desktop?.map((step) => step.target)).toEqual([
      testId("create-goal-unit-info"),
      ladder,
      milestones,
      testId("create-goal-acquisition-sources"),
      testId("goal-mythic-material-sources"),
      testId("create-goal-projects"),
      testId("create-goal-issue-summary"),
    ])
    const [status, ladderStep, milestoneStep] = result.current.desktop ?? []
    expect(status?.title).toBe("Current status")
    expect(ladderStep?.title).toBe("Target ladder")
    expect(milestoneStep?.content).toBe(
      "Add milestone to plan several targets for this unit at once, such as Gold 1, then Diamond 1, then Diamond 3. Each becomes its own goal, after the one before it."
    )
    expect(result.current.desktop?.some((step) => step.before)).toBe(false)
  })

  it("mobile steps start with the step indicator and walk the composer steps", async () => {
    const setMobileStep = vi.fn()
    document.body.innerHTML = `<div data-testid="create-goal-step-indicator"></div><div data-testid="create-goal-unit-info"></div><div data-testid="create-goal-rank-end"></div><div data-testid="create-goal-rank-milestones"></div><div data-testid="create-goal-acquisition-sources"></div><div data-testid="goal-mythic-material-sources"></div><div data-testid="create-goal-issue-summary"></div><div data-testid="create-goal-projects"></div>`
    const { result } = renderHook(() =>
      useCreateGoalSheetTutorial(setMobileStep)
    )

    const steps = result.current.mobile ?? []
    expect(steps.map((step) => step.target)).toEqual([
      testId("create-goal-step-indicator"),
      testId("create-goal-unit-info"),
      ladder,
      milestones,
      testId("create-goal-acquisition-sources"),
      testId("goal-mythic-material-sources"),
      testId("create-goal-issue-summary"),
      testId("create-goal-projects"),
    ])
    expect(steps[0]?.title).toBe("Three steps")
    for (const step of steps) await step.before?.({} as never)
    expect(setMobileStep.mock.calls.map(([step]) => step)).toEqual([
      "unit",
      "unit",
      "goals",
      "goals",
      "goals",
      "goals",
      "goals",
      "review",
    ])
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
