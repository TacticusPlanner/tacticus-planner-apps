import { describe, expect, it } from "vitest"

import {
  orderRowsByDuration,
  orderRowsByFinishDate,
  orderRowsByGlobalPriority,
} from "./goal-row-order"
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

describe("orderRowsByFinishDate", () => {
  it("puts the soonest finish first and goals without an estimate last, keeping priority on ties", () => {
    const rows = ["a", "b", "c", "d", "e"].map(
      (goalId) => ({ goalId }) as GoalRow
    )
    const days = new Map<string, { days?: number }>([
      ["a", { days: 30 }],
      ["b", {}],
      ["c", { days: 5 }],
      ["e", { days: 5 }],
    ])

    expect(orderRowsByFinishDate(rows, days).map((r) => r.goalId)).toEqual([
      "c",
      "e",
      "a",
      "b",
      "d",
    ])
  })
})

describe("orderRowsByDuration", () => {
  it("puts the shortest raid duration first and goals without raids last, keeping priority on ties", () => {
    const rows = ["a", "b", "c", "d"].map((goalId) => ({ goalId }) as GoalRow)
    const durations = new Map([
      ["a", 9],
      ["c", 2],
      ["d", 9],
    ])

    expect(
      orderRowsByDuration(rows, (goalId) => durations.get(goalId)).map(
        (r) => r.goalId
      )
    ).toEqual(["c", "a", "d", "b"])
  })
})
