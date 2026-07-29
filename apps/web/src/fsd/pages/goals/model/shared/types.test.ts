import { describe, expect, it } from "vitest"

import { goalRowFromProjectMember, goalRowFromSummary } from ".//types"

const goalRow = {
  goalId: "goal-1",
  entityType: "Character" as const,
  entityId: "character-1",
  goalType: "Rank" as const,
  status: "Active" as const,
  notes: "Promote next",
  updatedAt: "2026-07-16T12:00:00Z",
}

const goal = {
  ...goalRow,
  createdAt: "2026-07-15T12:00:00Z",
}

describe("goal row mappings", () => {
  it("maps a goal summary to a flat row", () => {
    expect(goalRowFromSummary(goal)).toEqual(goalRow)
  })

  it("maps a project member and preserves its priority", () => {
    expect(
      goalRowFromProjectMember({
        goal,
        priority: 4,
      })
    ).toEqual({
      ...goalRow,
      priority: 4,
    })
  })
})
