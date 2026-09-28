import { describe, expect, it } from "vitest"

import { applyOptimisticGoalRemoval } from "./optimistic-goal-removal"

describe("applyOptimisticGoalRemoval", () => {
  it("removes a flat-list entry while preserving sibling references and metadata", () => {
    const list = {
      goals: [{ goalId: "g1" }, { goalId: "g2" }],
      revision: 3,
    }
    const result = applyOptimisticGoalRemoval(list, "g1") as typeof list
    expect(result).toEqual({ goals: [list.goals[1]], revision: 3 })
    expect(result.goals[0]).toBe(list.goals[1])
    expect(list.goals).toHaveLength(2)
  })

  it("removes a project membership by its nested goal id", () => {
    const list = {
      goals: [
        { priority: 1, goal: { goalId: "g1" } },
        { priority: 2, goal: { goalId: "g2" } },
      ],
    }
    const result = applyOptimisticGoalRemoval(list, "g1") as typeof list
    expect(result.goals).toEqual([list.goals[1]])
    expect(result.goals[0]).toBe(list.goals[1])
    expect(list.goals).toHaveLength(2)
  })

  it.each(["g1", "other"])(
    "leaves a cached detail for %s untouched",
    (goalId) => {
      const detail = { goalId, status: "Active", notes: null }
      expect(applyOptimisticGoalRemoval(detail, "g1")).toBe(detail)
    }
  )

  it.each([
    { goals: [] },
    { goals: [{ goalId: "g2" }] },
    { goals: [{ priority: 1, goal: { goalId: "g2" } }] },
  ])("preserves a list with no matching entry: %j", (list) => {
    expect(applyOptimisticGoalRemoval(list, "g1")).toBe(list)
  })

  it("removes the final entry", () => {
    expect(
      applyOptimisticGoalRemoval({ goals: [{ goalId: "g1" }] }, "g1")
    ).toEqual({ goals: [] })
  })

  it.each([
    undefined,
    null,
    1,
    "text",
    {},
    { goals: null },
    { goals: [null, {}, { goal: null }] },
  ])("passes through unsupported data unchanged: %j", (data) => {
    expect(applyOptimisticGoalRemoval(data, "g1")).toBe(data)
  })
})

describe("Rank milestones for one character", () => {
  const bellator = (goalId: string, status = "Active") => ({
    goalId,
    entityType: "Character",
    entityId: "bellator",
    goalType: "Rank",
    status,
  })

  it("removes only the deleted milestone, leaving the other target listed", () => {
    const list = { goals: [bellator("silver3"), bellator("gold1")] }

    const result = applyOptimisticGoalRemoval(list, "silver3") as typeof list

    expect(result.goals.map((goal) => goal.goalId)).toEqual(["gold1"])
  })
})
