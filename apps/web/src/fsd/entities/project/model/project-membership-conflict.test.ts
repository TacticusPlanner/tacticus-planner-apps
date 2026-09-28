import { describe, expect, it } from "vitest"

import {
  projectLastMembershipDetails,
  projectMembershipStaleDetails,
  projectSlotConflictGoalIds,
} from "./project-membership-conflict"

describe("projectMembershipStaleDetails", () => {
  const stale = {
    issueCode: "projectMembershipStale",
    message: "changed",
    projectId: "p",
    currentGoalIds: ["a", "b"],
  }

  it("accepts the stale-membership body", () => {
    expect(projectMembershipStaleDetails(stale)).toEqual(stale)
  })

  it("rejects other bodies", () => {
    expect(projectMembershipStaleDetails(null)).toBeNull()
    expect(
      projectMembershipStaleDetails({ ...stale, issueCode: "other" })
    ).toBeNull()
    expect(
      projectMembershipStaleDetails({ ...stale, currentGoalIds: [1] })
    ).toBeNull()
  })
})

describe("projectLastMembershipDetails", () => {
  const blocked = {
    issueCode: "lastProjectMembership",
    message: "nope",
    blockedGoalIds: ["a"],
  }

  it("accepts the last-membership body", () => {
    expect(projectLastMembershipDetails(blocked)).toEqual(blocked)
  })

  it("rejects other bodies", () => {
    expect(projectLastMembershipDetails(undefined)).toBeNull()
    expect(
      projectLastMembershipDetails({ ...blocked, blockedGoalIds: "a" })
    ).toBeNull()
  })
})

describe("projectSlotConflictGoalIds", () => {
  it("collects the existing goal and every conflicting project's goal once", () => {
    expect(
      projectSlotConflictGoalIds({
        issueCode: "projectGoalSlotOccupied",
        existingGoalId: "a",
        conflicts: [{ existingGoalId: "a" }, { existingGoalId: "b" }],
      })
    ).toEqual(["a", "b"])
  })

  it("is null for any other error", () => {
    expect(projectSlotConflictGoalIds({ issueCode: "x" })).toBeNull()
    expect(projectSlotConflictGoalIds(undefined)).toBeNull()
  })
})
