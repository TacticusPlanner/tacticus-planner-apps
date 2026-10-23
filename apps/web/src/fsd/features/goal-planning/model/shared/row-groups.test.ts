import { describe, expect, it } from "vitest"

import { groupRows } from "./row-groups"
import type { GoalRow } from "./types"

const row = (overrides: Partial<GoalRow> = {}): GoalRow => ({
  goalId: "goal-1",
  entityType: "Character",
  entityId: "hero1",
  goalType: "Rank",
  status: "Active",
  notes: null,
  updatedAt: "2026-01-01T00:00:00Z",
  ...overrides,
})

describe("groupRows", () => {
  it("puts every row in one unlabelled group when grouping is off", () => {
    const rows = [row(), row({ goalId: "goal-2", goalType: "Ability" })]

    expect(groupRows(rows, "none")).toEqual([
      { key: "all", dimension: "none", rows },
    ])
  })

  it("groups by unit, keeping a unit's several goal types together", () => {
    const rank = row({ goalId: "goal-1" })
    const ability = row({ goalId: "goal-2", goalType: "Ability" })
    const other = row({ goalId: "goal-3", entityId: "hero2" })

    expect(groupRows([rank, ability, other], "unit")).toEqual([
      { key: "Character:hero1", dimension: "unit", rows: [rank, ability] },
      { key: "Character:hero2", dimension: "unit", rows: [other] },
    ])
  })

  it("groups by goal type", () => {
    const rank = row({ goalId: "goal-1" })
    const ability = row({ goalId: "goal-2", goalType: "Ability" })
    const secondRank = row({ goalId: "goal-3", entityId: "hero2" })

    expect(groupRows([rank, ability, secondRank], "type")).toEqual([
      { key: "Rank", dimension: "type", rows: [rank, secondRank] },
      { key: "Ability", dimension: "type", rows: [ability] },
    ])
  })

  it("distinguishes a Character from a Mow sharing an entity id", () => {
    const character = row({ goalId: "goal-1" })
    const mow = row({ goalId: "goal-2", entityType: "Mow" })

    expect(groupRows([character, mow], "unit").map((g) => g.key)).toEqual([
      "Character:hero1",
      "Mow:hero1",
    ])
  })

  it("survives an empty row set", () => {
    expect(groupRows([], "type")).toEqual([])
  })

  it("preserves a pre-sorted row set: group order by first appearance, row order untouched", () => {
    // Sorted newest-first, the way both routes' default Sort leaves them.
    const sorted = [
      row({ goalId: "b-newest", goalType: "Ability", updatedAt: "2026-03" }),
      row({ goalId: "a-newer", goalType: "Rank", updatedAt: "2026-02" }),
      row({ goalId: "b-older", goalType: "Ability", updatedAt: "2026-01" }),
    ]

    const groups = groupRows(sorted, "type")

    expect(groups.map((group) => group.key)).toEqual(["Ability", "Rank"])
    expect(groups.flatMap((group) => group.rows.map((r) => r.goalId))).toEqual([
      "b-newest",
      "b-older",
      "a-newer",
    ])
  })
})
