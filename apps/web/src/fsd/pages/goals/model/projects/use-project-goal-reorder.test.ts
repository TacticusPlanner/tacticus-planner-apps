import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { ProjectGoalSummary } from "@/entities/project"
import { useProjectGoalReorder } from "./use-project-goal-reorder"

function entry(goalId: string, status = "Active"): ProjectGoalSummary {
  return {
    goal: {
      goalId,
      entityType: "Character",
      entityId: `unit-${goalId}`,
      goalType: "Rank",
      status,
      notes: null,
      dependsOn: [],
      createdAt: "",
      updatedAt: "",
      globalPriority: 1,
    },
  }
}

// A project holding A, C and E of the global order A, B, C, D, E (B and D belong to other projects).
const projection = [entry("a"), entry("c"), entry("e")]

function setup(goals = projection) {
  const moveGoal = vi.fn()
  const { result } = renderHook(() => useProjectGoalReorder(goals, moveGoal))
  return { moveGoal, ...result.current }
}

describe("useProjectGoalReorder", () => {
  it("turns dragging E above C into a move of E onto C", () => {
    const { moveGoal, handleReorder } = setup()

    handleReorder(["a", "e", "c"], "e")

    expect(moveGoal).toHaveBeenCalledWith("e", "c")
  })

  it("turns dragging C below E into a move of C onto E", () => {
    const { moveGoal, handleReorder } = setup()

    handleReorder(["a", "e", "c"], "c")

    expect(moveGoal).toHaveBeenCalledWith("c", "e")
  })

  it("moves a goal to the top onto the goal that was first", () => {
    const { moveGoal, handleReorder } = setup()

    handleReorder(["e", "a", "c"], "e")

    expect(moveGoal).toHaveBeenCalledWith("e", "a")
  })

  it("sends nothing when the goal is dropped where it already was", () => {
    const { moveGoal, handleReorder } = setup()

    handleReorder(["a", "c", "e"], "c")

    expect(moveGoal).not.toHaveBeenCalled()
  })

  it("anchors on visible neighbours even when a historical goal is shown between them", () => {
    const { moveGoal, handleReorder } = setup([
      ...projection,
      entry("done", "Completed"),
    ])

    // The visible list interleaves the Completed goal; dropping E before C still lands it on C.
    handleReorder(["a", "done", "e", "c"], "e")

    expect(moveGoal).toHaveBeenCalledWith("e", "c")
  })

  it("counts only in-flight goals", () => {
    const { inFlightCount } = setup([...projection, entry("done", "Completed")])

    expect(inFlightCount).toBe(3)
  })
})
