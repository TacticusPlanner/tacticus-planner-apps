import { describe, expect, it } from "vitest"

import {
  desiredGoalIds,
  EMPTY_MEMBERSHIP_DRAFT,
  hasPendingChanges,
  isInDesiredSet,
  membershipDifference,
  reconcileDraft,
  toggleGoal,
} from "./membership-draft"

describe("membership draft", () => {
  it("starts with no pending changes", () => {
    expect(hasPendingChanges(EMPTY_MEMBERSHIP_DRAFT)).toBe(false)
  })

  it("toggles a non-member as an addition and a member as a removal, and back", () => {
    const added = toggleGoal(EMPTY_MEMBERSHIP_DRAFT, "new", false)
    expect(added).toEqual({ adds: ["new"], removes: [] })
    const removed = toggleGoal(added, "member", true)
    expect(removed).toEqual({ adds: ["new"], removes: ["member"] })
    expect(
      toggleGoal(toggleGoal(removed, "new", false), "member", true)
    ).toEqual(EMPTY_MEMBERSHIP_DRAFT)
  })

  it("derives the desired set from the baseline, never from what is visible", () => {
    const draft = { adds: ["new-1", "new-2"], removes: ["b"] }
    expect(desiredGoalIds(["a", "b", "c"], draft)).toEqual([
      "a",
      "c",
      "new-1",
      "new-2",
    ])
    expect(desiredGoalIds(["a", "b"], EMPTY_MEMBERSHIP_DRAFT)).toEqual([
      "a",
      "b",
    ])
  })

  it("reports membership in the desired set", () => {
    const baseline = new Set(["a", "b"])
    const draft = { adds: ["c"], removes: ["b"] }
    expect(isInDesiredSet(baseline, draft, "a")).toBe(true)
    expect(isInDesiredSet(baseline, draft, "b")).toBe(false)
    expect(isInDesiredSet(baseline, draft, "c")).toBe(true)
    expect(isInDesiredSet(baseline, draft, "d")).toBe(false)
  })

  it("reconciles the draft against a refreshed baseline, keeping the rest", () => {
    const draft = { adds: ["x", "y"], removes: ["a", "b"] }
    expect(reconcileDraft(draft, ["x", "b"])).toEqual({
      adds: ["y"],
      removes: ["b"],
    })
  })

  it("describes what changed elsewhere", () => {
    expect(membershipDifference(["a", "b"], ["b", "c"])).toEqual({
      addedElsewhere: ["c"],
      removedElsewhere: ["a"],
    })
  })
})
