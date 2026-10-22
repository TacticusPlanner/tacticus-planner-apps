import { describe, expect, it } from "vitest"

import { ApiError } from "@/shared/api"

import { goalSlotConflict } from "./project-membership"

describe("goalSlotConflict", () => {
  it("exposes the existing goal of a slotOccupied 409", () => {
    const existing = { goalId: "goal-1", entityId: "ragnar", goalType: "Rank" }
    const error = new ApiError(409, "Occupied", {
      issueCode: "slotOccupied",
      current: existing,
    })

    expect(goalSlotConflict(error)?.current).toBe(existing)
  })

  it("rejects other errors", () => {
    expect(goalSlotConflict(new Error("x"))).toBeNull()
    expect(
      goalSlotConflict(
        new ApiError(409, "x", { issueCode: "goalRevisionStale", current: {} })
      )
    ).toBeNull()
  })
})
