import { describe, expect, it } from "vitest"

import { ApiError } from "@/shared/api"

import { legendaryEventPlanConflict } from "./plan.types"

const plan = {
  eventId: "astarLysander",
  revision: 4,
  catalogVersion: "1.2.3",
  notes: null,
  showPaidOptions: false,
  teams: [],
  runs: [],
  annotations: [],
}

describe("legendaryEventPlanConflict", () => {
  it.each(["legendaryEventPlanStale", "legendaryEventOrderSetMismatch"])(
    "exposes the current plan of a %s 409",
    (issueCode) => {
      const error = new ApiError(409, "Stale.", { issueCode, current: plan })
      expect(legendaryEventPlanConflict(error)).toEqual({
        issueCode,
        current: plan,
      })
    }
  )

  it("rejects a goal conflict, a plan code without a plan, and non-API errors", () => {
    expect(
      legendaryEventPlanConflict(
        new ApiError(409, "x", { issueCode: "goalRevisionStale", current: {} })
      )
    ).toBeNull()
    expect(
      legendaryEventPlanConflict(
        new ApiError(409, "x", { issueCode: "legendaryEventPlanStale" })
      )
    ).toBeNull()
    expect(legendaryEventPlanConflict(new Error("409"))).toBeNull()
  })
})
