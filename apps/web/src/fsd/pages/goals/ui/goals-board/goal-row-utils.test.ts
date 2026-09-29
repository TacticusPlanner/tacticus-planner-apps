import { describe, expect, it } from "vitest"

import type { GoalRow } from "../../model/shared/types"
import {
  buildCascadeContext,
  cascadeTargets,
  goalXpBookFigure,
} from "./goal-row-utils"

function row(overrides: Partial<GoalRow> = {}): GoalRow {
  return {
    goalId: "goal-1",
    entityType: "Character",
    entityId: "hero1",
    goalType: "Rank",
    status: "Active",
    notes: null,
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("buildCascadeContext", () => {
  it("maps every row's own status by id", () => {
    const context = buildCascadeContext([
      row({ goalId: "a", status: "Active" }),
      row({ goalId: "b", status: "Paused" }),
    ])

    expect(context.statusById.get("a")).toBe("Active")
    expect(context.statusById.get("b")).toBe("Paused")
  })

  it("counts how many rows depend on each id", () => {
    const context = buildCascadeContext([
      row({ goalId: "b", dependsOn: ["a"] }),
      row({ goalId: "c", dependsOn: ["a"] }),
      row({ goalId: "d", dependsOn: ["e"] }),
    ])

    expect(context.dependentCountById.get("a")).toBe(2)
    expect(context.dependentCountById.get("e")).toBe(1)
    expect(context.dependentCountById.get("b")).toBeUndefined()
  })

  it("handles rows with no dependsOn at all", () => {
    const context = buildCascadeContext([row({ dependsOn: undefined })])
    expect(context.dependentCountById.size).toBe(0)
  })
})

describe("cascadeTargets", () => {
  it("returns nothing when dependsOn is empty or context is absent", () => {
    const context = buildCascadeContext([row({ goalId: "a" })])
    expect(cascadeTargets(undefined, "Paused", context)).toEqual([])
    expect(cascadeTargets([], "Paused", context)).toEqual([])
    expect(cascadeTargets(["a"], "Paused", undefined)).toEqual([])
  })

  it("pauses a sole-dependent prerequisite", () => {
    const context = buildCascadeContext([
      row({ goalId: "b", dependsOn: ["a"] }),
      row({ goalId: "a", status: "Active" }),
    ])
    expect(cascadeTargets(["a"], "Paused", context)).toEqual(["a"])
  })

  it("does not pause a prerequisite shared by more than one dependent", () => {
    const context = buildCascadeContext([
      row({ goalId: "b", dependsOn: ["a"] }),
      row({ goalId: "c", dependsOn: ["a"], status: "Active" }),
      row({ goalId: "a", status: "Active" }),
    ])
    expect(cascadeTargets(["a"], "Paused", context)).toEqual([])
  })

  it("resumes a shared prerequisite unconditionally", () => {
    const context = buildCascadeContext([
      row({ goalId: "b", dependsOn: ["a"] }),
      row({ goalId: "c", dependsOn: ["a"], status: "Active" }),
      row({ goalId: "a", status: "Paused" }),
    ])
    expect(cascadeTargets(["a"], "Active", context)).toEqual(["a"])
  })

  it("excludes a Completed prerequisite from either direction", () => {
    const context = buildCascadeContext([
      row({ goalId: "b", dependsOn: ["a"] }),
      row({ goalId: "a", status: "Completed" }),
    ])
    expect(cascadeTargets(["a"], "Paused", context)).toEqual([])
    expect(cascadeTargets(["a"], "Active", context)).toEqual([])
  })

  it("excludes an Archived prerequisite from either direction", () => {
    const context = buildCascadeContext([
      row({ goalId: "b", dependsOn: ["a"] }),
      row({ goalId: "a", status: "Archived" }),
    ])
    expect(cascadeTargets(["a"], "Paused", context)).toEqual([])
    expect(cascadeTargets(["a"], "Active", context)).toEqual([])
  })

  it("excludes a dependency id with no known status", () => {
    const context = buildCascadeContext([
      row({ goalId: "b", dependsOn: ["ghost"] }),
    ])
    expect(cascadeTargets(["ghost"], "Paused", context)).toEqual([])
  })

  it("filters a mixed dependsOn set to only the surviving ids", () => {
    const context = buildCascadeContext([
      row({ goalId: "b", dependsOn: ["a", "c", "d"] }),
      row({ goalId: "a", status: "Active" }),
      row({ goalId: "c", status: "Completed" }),
      row({ goalId: "e", dependsOn: ["d"], status: "Active" }),
      row({ goalId: "d", status: "Active" }),
    ])
    expect(cascadeTargets(["a", "c", "d"], "Paused", context)).toEqual(["a"])
  })
})

describe("goalXpBookFigure", () => {
  it("expresses charged XP and pool XP as needed/available books in the rarity", () => {
    // 12,200 charged / 12,500 per Legendary book = 1 needed; 100,000 pool = 8 available.
    expect(goalXpBookFigure(12_200, 100_000, "Legendary")).toEqual({
      available: 8,
      needed: 1,
      rarity: "Legendary",
    })
  })

  it("falls back to Legendary for a missing or unknown rarity", () => {
    expect(goalXpBookFigure(12_500, 0, undefined)?.rarity).toBe("Legendary")
    expect(goalXpBookFigure(12_500, 0, "Bogus")?.rarity).toBe("Legendary")
  })

  it("is undefined when the goal needs no level-up", () => {
    expect(goalXpBookFigure(undefined, 100_000, "Legendary")).toBeUndefined()
    expect(goalXpBookFigure(0, 100_000, "Legendary")).toBeUndefined()
  })
})
