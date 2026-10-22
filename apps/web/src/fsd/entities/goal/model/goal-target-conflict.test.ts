import { describe, expect, it } from "vitest"

import { ApiError } from "@/shared/api"

import { goalRevisionConflict } from "./goal-target-conflict"

describe("goalRevisionConflict", () => {
  it("exposes the current goal of a goalRevisionStale 409", () => {
    const current = { goalId: "goal-1", revision: 8 }
    const error = new ApiError(409, "The goal changed", {
      issueCode: "goalRevisionStale",
      current,
    })

    expect(goalRevisionConflict(error)?.current).toBe(current)
  })

  it.each([
    null,
    new Error("network"),
    new ApiError(409, "x", { issueCode: "slotOccupied", current: {} }),
    new ApiError(409, "x", { issueCode: "goalRevisionStale" }),
  ])("rejects anything else: %s", (error) => {
    expect(goalRevisionConflict(error)).toBeNull()
  })
})
