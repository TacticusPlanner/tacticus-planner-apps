import { describe, expect, it } from "vitest"

import {
  computeLevelMerges,
  excludeMergedLevelGoals,
  levelGoalIdByParent,
} from "./level-goal-merge"
import type { GoalRow } from "./types"

function row(overrides: Partial<GoalRow> & { goalId: string }): GoalRow {
  return {
    entityType: "Character",
    entityId: "hero1",
    goalType: "Rank",
    status: "Active",
    notes: null,
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

describe("computeLevelMerges", () => {
  it("merges a Level goal with exactly one dependent", () => {
    const rows = [
      row({ goalId: "rank-1", dependsOn: ["level-1"] }),
      row({ goalId: "level-1", goalType: "Level" }),
    ]
    expect(computeLevelMerges(rows)).toEqual(new Map([["level-1", "rank-1"]]))
  })

  it("does not merge a Level goal with no dependent", () => {
    const rows = [row({ goalId: "level-1", goalType: "Level" })]
    expect(computeLevelMerges(rows)).toEqual(new Map())
  })

  it("does not merge a Level goal depended on by more than one goal", () => {
    const rows = [
      row({ goalId: "rank-1", dependsOn: ["level-1"] }),
      row({ goalId: "ability-1", goalType: "Ability", dependsOn: ["level-1"] }),
      row({ goalId: "level-1", goalType: "Level" }),
    ]
    expect(computeLevelMerges(rows)).toEqual(new Map())
  })

  it("ignores a dependsOn edge to a goal outside the current row set", () => {
    const rows = [row({ goalId: "rank-1", dependsOn: ["level-elsewhere"] })]
    expect(computeLevelMerges(rows)).toEqual(new Map())
  })
})

describe("excludeMergedLevelGoals", () => {
  it("drops the merged Level goal's own row, keeps everything else", () => {
    const rows = [
      row({ goalId: "rank-1", dependsOn: ["level-1"] }),
      row({ goalId: "level-1", goalType: "Level" }),
      row({ goalId: "unrelated" }),
    ]
    const merges = computeLevelMerges(rows)
    expect(excludeMergedLevelGoals(rows, merges).map((r) => r.goalId)).toEqual([
      "rank-1",
      "unrelated",
    ])
  })
})

describe("levelGoalIdByParent", () => {
  it("inverts the map so a dependent's row can look up its attached Level goal", () => {
    const merges = new Map([["level-1", "rank-1"]])
    expect(levelGoalIdByParent(merges)).toEqual(
      new Map([["rank-1", "level-1"]])
    )
  })
})
