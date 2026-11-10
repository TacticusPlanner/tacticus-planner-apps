import { describe, expect, it } from "vitest"

import { linkedGoalsOf, resolveGoalLinks } from "./goal-links"
import type { GoalDetail } from "./types"

const goal = (overrides: Partial<GoalDetail>): GoalDetail =>
  ({
    goalId: "goal",
    entityType: "Character",
    entityId: "revas",
    goalType: "Rank",
    status: "Active",
    globalPriority: 1,
    linkedGoalIds: [],
    config: {
      rank: null,
      progression: null,
      ability: null,
      farmingLocationIds: null,
      farmingStrategy: "TotalUpgrades",
      acquisitionSources: null,
      upgrade: null,
    },
    ...overrides,
  }) as GoalDetail

const rank = (goalId: string, start: number, end: number, extra = {}) =>
  goal({
    goalId,
    config: {
      ...goal({}).config,
      rank: {
        start,
        startPointFive: false,
        startAppliedUpgrades: 0,
        end,
        endPointFive: false,
        endAppliedUpgrades: 0,
        ...extra,
      },
    },
  })

const upgrade = (linkedGoalIds: string[]) =>
  goal({
    goalId: "chips",
    goalType: "Upgrade",
    linkedGoalIds,
    config: {
      ...goal({}).config,
      upgrade: {
        targets: [{ upgradeId: "upgChip", quantity: 45 }],
        rankRange: { start: 13, end: 15 },
        activeRange: null,
        passiveRange: null,
      },
    },
  })

describe("resolveGoalLinks", () => {
  it("gives a linked Upgrade goal its linked Rank goals' span", () => {
    const [, , resolved] = resolveGoalLinks([
      rank("to-d1", 13, 15),
      rank("to-d3", 15, 17, { endPointFive: true }),
      upgrade(["to-d1", "to-d3"]),
    ])
    expect(resolved?.config.upgrade?.rankRange).toEqual({ start: 13, end: 18 })
  })

  it("keeps the goal's own range when every link is gone or done", () => {
    const done = { ...rank("done", 10, 12), status: "Completed" as const }
    const [, resolved] = resolveGoalLinks([done, upgrade(["done", "deleted"])])
    expect(resolved?.config.upgrade?.rankRange).toEqual({ start: 13, end: 15 })
  })
})

describe("linkedGoalsOf", () => {
  it("ignores links to another unit's goals", () => {
    const other = { ...rank("other", 1, 3), entityId: "kariyan" }
    expect(
      linkedGoalsOf(upgrade(["other"]), new Map([["other", other]]))
    ).toEqual([])
  })
})
