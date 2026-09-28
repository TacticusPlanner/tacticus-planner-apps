import { describe, expect, it } from "vitest"

import { orderRowsByGlobalPriority } from "./goal-row-order"
import type { GoalRow } from "./types"

const row = (
  goalId: string,
  status: GoalRow["status"],
  priority: number | undefined,
  updatedAt: string
): GoalRow => ({
  goalId,
  entityType: "Character",
  entityId: goalId,
  goalType: "Rank",
  status,
  notes: null,
  updatedAt,
  priority,
})

describe("orderRowsByGlobalPriority", () => {
  it("orders Active and Paused goals by global position, then the rest by recency", () => {
    const ordered = orderRowsByGlobalPriority([
      row("archived", "Archived", undefined, "2026-03-01"),
      row("c", "Active", 3, "2026-01-01"),
      row("older-done", "Completed", undefined, "2026-01-01"),
      row("a", "Active", 1, "2026-01-01"),
      row("b", "Paused", 2, "2026-01-01"),
    ])

    expect(ordered.map((entry) => entry.goalId)).toEqual([
      "a",
      "b",
      "c",
      "archived",
      "older-done",
    ])
  })

  it("does not mutate its input", () => {
    const rows = [row("b", "Active", 2, ""), row("a", "Active", 1, "")]
    orderRowsByGlobalPriority(rows)
    expect(rows.map((entry) => entry.goalId)).toEqual(["b", "a"])
  })
})
