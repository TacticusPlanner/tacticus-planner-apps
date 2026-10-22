import { describe, expect, it } from "vitest"

import { ApiError } from "@/shared/api"

import {
  projectLastMembership,
  projectMembershipConflict,
} from "./project-membership-conflict"

describe("projectMembershipConflict", () => {
  it("exposes the current membership of a membershipStale 409", () => {
    const error = new ApiError(409, "changed", {
      issueCode: "membershipStale",
      current: { projectId: "p", goalIds: ["a", "b"] },
    })

    expect(projectMembershipConflict(error)).toEqual({
      message: "changed",
      current: { goalIds: ["a", "b"] },
    })
  })

  it("rejects other errors", () => {
    expect(projectMembershipConflict(null)).toBeNull()
    expect(
      projectMembershipConflict(
        new ApiError(409, "x", { issueCode: "slotOccupied", current: {} })
      )
    ).toBeNull()
    expect(
      projectMembershipConflict(
        new ApiError(409, "x", {
          issueCode: "membershipStale",
          current: { goalIds: [1] },
        })
      )
    ).toBeNull()
  })
})

describe("projectLastMembership", () => {
  it("names the blocked goals of a lastProjectMembership 400", () => {
    const error = new ApiError(400, "blocked", {
      issueCode: "lastProjectMembership",
      extensions: { blockedGoalIds: ["a"] },
    })

    expect(projectLastMembership(error)).toEqual({
      message: "blocked",
      blockedGoalIds: ["a"],
    })
  })

  it("rejects other errors", () => {
    expect(
      projectLastMembership(new ApiError(400, "x", { issueCode: "validation" }))
    ).toBeNull()
  })
})
