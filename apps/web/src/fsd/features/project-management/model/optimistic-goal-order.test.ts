import { describe, expect, it } from "vitest"

import type { ProjectGoalSummary } from "@/entities/project"
import { applyOptimisticGoalOrder } from "./optimistic-goal-order"

function goal(id: string, priority: number): ProjectGoalSummary {
  return {
    goal: {
      goalId: id,
      entityType: "character",
      entityId: id,
      goalType: "Rank",
      status: "Active",
      notes: null,
      dependsOn: [],
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    },
    priority,
  }
}

describe("applyOptimisticGoalOrder", () => {
  it("renumbers the submitted in-flight ids 1..N in the new order", () => {
    const goals = [goal("a", 1), goal("b", 2), goal("c", 3)]
    const result = applyOptimisticGoalOrder(goals, ["c", "a", "b"])
    expect(result.map((entry) => entry.goal.goalId)).toEqual(["c", "a", "b"])
    expect(result.map((entry) => entry.priority)).toEqual([1, 2, 3])
  })

  it("keeps historical goals after every in-flight goal, in their prior relative order", () => {
    const goals = [
      goal("a", 1),
      goal("archived-1", 2),
      goal("b", 3),
      goal("archived-2", 4),
    ]
    const result = applyOptimisticGoalOrder(goals, ["b", "a"])
    expect(result.map((entry) => entry.goal.goalId)).toEqual([
      "b",
      "a",
      "archived-1",
      "archived-2",
    ])
    expect(result.map((entry) => entry.priority)).toEqual([1, 2, 3, 4])
  })
})
