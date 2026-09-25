import { describe, expect, it } from "vitest"

import { goalRevisionConflictDetails } from "./goal-target-conflict"

describe("goalRevisionConflictDetails", () => {
  it("narrows the stale-revision body and exposes the current goal", () => {
    const body = {
      issueCode: "goalRevisionStale",
      message: "The goal changed",
      goal: { goalId: "goal-1", revision: 8 },
    }

    expect(goalRevisionConflictDetails(body)?.goal.revision).toBe(8)
  })

  it.each([
    null,
    "text",
    { issueCode: "projectGoalSlotOccupied", message: "x" },
    { issueCode: "goalRevisionStale", message: "x" },
  ])("rejects anything else: %j", (body) => {
    expect(goalRevisionConflictDetails(body)).toBeNull()
  })
})
