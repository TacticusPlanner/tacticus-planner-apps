import { describe, expect, it } from "vitest"

import { legendaryEventPlanConflictDetails } from "./plan.types"

const plan = {
  eventId: "astarLysander",
  revision: 4,
  catalogVersion: "1.2.3",
  notes: null,
  showPaidOptions: false,
  teams: [],
}

describe("legendaryEventPlanConflictDetails", () => {
  it.each(["legendaryEventPlanStale", "legendaryEventOrderSetMismatch"])(
    "narrows a %s 409 body",
    (issueCode) => {
      const body = { issueCode, message: "Stale.", plan }
      expect(legendaryEventPlanConflictDetails(body)).toBe(body)
    }
  )

  it("rejects a goal conflict body", () => {
    expect(
      legendaryEventPlanConflictDetails({
        issueCode: "goalRevisionStale",
        message: "Stale.",
        goal: { goalId: "g1" },
      })
    ).toBeNull()
  })

  it("rejects a plan code without a plan, and non-objects", () => {
    expect(
      legendaryEventPlanConflictDetails({
        issueCode: "legendaryEventPlanStale",
        message: "Stale.",
      })
    ).toBeNull()
    expect(legendaryEventPlanConflictDetails(null)).toBeNull()
    expect(legendaryEventPlanConflictDetails("409")).toBeNull()
  })
})
