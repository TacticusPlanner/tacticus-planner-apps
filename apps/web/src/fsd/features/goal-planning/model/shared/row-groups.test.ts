import { describe, expect, it } from "vitest"

import { expandedRows, groupRows, rowGroupId } from "./row-groups"
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

  it("orders type groups by their highest-priority goal under typePriority", () => {
    const ability = row({ goalId: "goal-1", goalType: "Ability" })
    const rank = row({ goalId: "goal-2" })
    const secondAbility = row({
      goalId: "goal-3",
      entityId: "hero2",
      goalType: "Ability",
    })

    expect(groupRows([ability, rank, secondAbility], "typePriority")).toEqual([
      {
        key: "Ability",
        dimension: "typePriority",
        rows: [ability, secondAbility],
      },
      { key: "Rank", dimension: "typePriority", rows: [rank] },
    ])
    // The fixed order still puts Rank first for the same rows.
    expect(
      groupRows([ability, rank, secondAbility], "type").map((g) => g.key)
    ).toEqual(["Rank", "Ability"])
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

  it("lists type groups Rank first, whatever type holds the top-priority goal", () => {
    // Global priority order: an Ability goal leads, then Upgrade, Rank and Ascension.
    const sorted = [
      row({ goalId: "ability-1", goalType: "Ability" }),
      row({ goalId: "upgrade-1", goalType: "Upgrade" }),
      row({ goalId: "rank-1", goalType: "Rank" }),
      row({ goalId: "ability-2", goalType: "Ability" }),
      row({ goalId: "ascension-1", goalType: "Ascension" }),
      row({ goalId: "rank-2", goalType: "Rank" }),
    ]

    const groups = groupRows(sorted, "type")

    expect(groups.map((group) => group.key)).toEqual([
      "Rank",
      "Ascension",
      "Ability",
      "Upgrade",
    ])
    expect(groups.flatMap((group) => group.rows.map((r) => r.goalId))).toEqual([
      "rank-1",
      "rank-2",
      "ascension-1",
      "ability-1",
      "ability-2",
      "upgrade-1",
    ])
  })

  it("preserves a pre-sorted row set for units: group order by first appearance, row order untouched", () => {
    const sorted = [
      row({ goalId: "b-newest", entityId: "hero2", updatedAt: "2026-03" }),
      row({ goalId: "a-newer", entityId: "hero1", updatedAt: "2026-02" }),
      row({ goalId: "b-older", entityId: "hero2", updatedAt: "2026-01" }),
    ]

    const groups = groupRows(sorted, "unit")

    expect(groups.map((group) => group.key)).toEqual([
      "Character:hero2",
      "Character:hero1",
    ])
    expect(groups.flatMap((group) => group.rows.map((r) => r.goalId))).toEqual([
      "b-newest",
      "b-older",
      "a-newer",
    ])
  })
})

describe("expandedRows", () => {
  const rank = row({ goalId: "goal-1" })
  const ability = row({ goalId: "goal-2", goalType: "Ability" })

  it("drops the rows of collapsed groups only", () => {
    const groups = groupRows([rank, ability], "type")

    expect(expandedRows(groups, new Set(["type:Rank"]))).toEqual([ability])
    expect(expandedRows(groups, new Set())).toEqual([rank, ability])
  })

  it("never collapses a group from another dimension", () => {
    expect(
      expandedRows(groupRows([rank, ability], "unit"), new Set(["type:Rank"]))
    ).toEqual([rank, ability])
  })

  it("ignores collapsed ids when grouping is off", () => {
    expect(
      expandedRows(groupRows([rank], "none"), new Set(["none:all"]))
    ).toEqual([rank])
  })
})

describe("rowGroupId", () => {
  it("prefixes the key with its dimension", () => {
    expect(rowGroupId({ dimension: "unit", key: "Character:hero1" })).toBe(
      "unit:Character:hero1"
    )
  })
})
