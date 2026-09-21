import { describe, expect, it } from "vitest"

import { applyOptimisticGoalStatus } from "./optimistic-goal-status"

describe("applyOptimisticGoalStatus", () => {
  it("patches a single cached GoalDetail object", () => {
    const detail = { goalId: "g1", status: "Active", notes: null }
    const result = applyOptimisticGoalStatus(detail, "g1", "Paused")
    expect(result).toEqual({ goalId: "g1", status: "Paused", notes: null })
    expect(result).not.toBe(detail)
  })

  it("leaves a non-matching cached GoalDetail untouched, same reference", () => {
    const detail = { goalId: "other", status: "Active" }
    const result = applyOptimisticGoalStatus(detail, "g1", "Paused")
    expect(result).toBe(detail)
  })

  it("patches a matching entry in a flat GoalSummary list", () => {
    const list = {
      goals: [
        { goalId: "g1", status: "Active" },
        { goalId: "g2", status: "Paused" },
      ],
    }
    const result = applyOptimisticGoalStatus(list, "g1", "Paused") as {
      goals: { goalId: string; status: string }[]
    }
    expect(result.goals[0]).toEqual({ goalId: "g1", status: "Paused" })
    expect(result.goals[1]).toEqual({ goalId: "g2", status: "Paused" })
    expect(result.goals[1]).toBe(list.goals[1])
  })

  it("patches a matching entry in a project-membership-wrapped list", () => {
    const list = {
      goals: [
        { priority: 1, goal: { goalId: "g1", status: "Active" } },
        { priority: 2, goal: { goalId: "g2", status: "Paused" } },
      ],
    }
    const result = applyOptimisticGoalStatus(list, "g1", "Paused") as {
      goals: { priority: number; goal: { goalId: string; status: string } }[]
    }
    expect(result.goals[0]?.goal).toEqual({ goalId: "g1", status: "Paused" })
    expect(result.goals[0]?.priority).toBe(1)
    expect(result.goals[1]).toBe(list.goals[1])
  })

  it("returns the same reference when no entry in the list matches", () => {
    const list = { goals: [{ goalId: "g2", status: "Active" }] }
    const result = applyOptimisticGoalStatus(list, "g1", "Paused")
    expect(result).toBe(list)
  })

  it("returns the same reference when the matching entry already has the target status", () => {
    const list = { goals: [{ goalId: "g1", status: "Paused" }] }
    const result = applyOptimisticGoalStatus(list, "g1", "Paused")
    expect(result).toBe(list)
  })

  it("passes through non-object, null, and shapeless data unchanged", () => {
    expect(applyOptimisticGoalStatus(undefined, "g1", "Paused")).toBeUndefined()
    expect(applyOptimisticGoalStatus(null, "g1", "Paused")).toBeNull()
    const opaque = { foo: "bar" }
    expect(applyOptimisticGoalStatus(opaque, "g1", "Paused")).toBe(opaque)
  })
})
