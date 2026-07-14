import { describe, expect, it } from "vitest"

import type { ProjectGoalSummary } from "@/entities/project"

import { reorderedMemberIds } from "./use-project-actions"

function member(goalId: string, priority: number): ProjectGoalSummary {
  return {
    goal: {
      goalId,
      entityType: "Character",
      entityId: goalId,
      goalType: "Rank",
      status: "Active",
      notes: null,
      aggregateId: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    priority,
  }
}

describe("reorderedMemberIds", () => {
  it("swaps a goal with its adjacent visible neighbor", () => {
    const members = [member("a", 10), member("b", 20), member("c", 30)]

    const result = reorderedMemberIds(members, "b", "up", ["a", "b", "c"])

    expect(result).toEqual(["b", "a", "c"])
  })

  it("preserves non-visible members' positions when reordering the visible subset", () => {
    // "x" is archived/completed and hidden from the Active tab, but must not be dropped or
    // reshuffled beyond swapping with its visible neighbor.
    const members = [member("a", 10), member("x", 15), member("b", 20)]

    const result = reorderedMemberIds(members, "a", "down", ["a", "b"])

    expect(result).toEqual(["b", "x", "a"])
  })

  it("returns undefined when moving past the start or end of the visible list", () => {
    const members = [member("a", 10), member("b", 20)]

    expect(reorderedMemberIds(members, "a", "up", ["a", "b"])).toBeUndefined()
    expect(reorderedMemberIds(members, "b", "down", ["a", "b"])).toBeUndefined()
  })
})
