import { describe, expect, it } from "vitest"

import type { GoalDetail } from "@/entities/goal"

import { computeGoalAttainment } from "./goal-attainment"
import { allocateUpgradeGoalStock } from "./upgrade-goal-stock"

function upgradeGoal(
  goalId: string,
  globalPriority: number | null,
  targets: { upgradeId: string; quantity: number }[],
  status = "Active"
) {
  return {
    goalId,
    status,
    globalPriority,
    entityType: "Character",
    goalType: "Upgrade",
    config: { upgrade: { targets } },
  } as GoalDetail
}

const boon = (quantity: number) => [{ upgradeId: "boon", quantity }]

/** Plain-string ids stand in for branded `UpgradeId`s in these fixtures. */
const inventory = (entries: { upgradeId: string; amount: number }[]) =>
  entries as unknown as Parameters<typeof allocateUpgradeGoalStock>[1]

describe("allocateUpgradeGoalStock", () => {
  it("gives the higher-priority goal its full need and the next one what is left", () => {
    const stock = allocateUpgradeGoalStock(
      [
        upgradeGoal("abraxas", 2, boon(27)),
        upgradeGoal("ahriman", 1, boon(27)),
      ],
      inventory([{ upgradeId: "boon", amount: 30 }])
    )
    expect(stock.get("ahriman")).toEqual([{ upgradeId: "boon", amount: 27 }])
    expect(stock.get("abraxas")).toEqual([{ upgradeId: "boon", amount: 3 }])
  })

  it("marks only the higher-priority goal reached (UserJot: upgrade goals share progress)", () => {
    const goals = [
      upgradeGoal("ahriman", 1, boon(27)),
      upgradeGoal("abraxas", 2, boon(27)),
    ]
    const stock = allocateUpgradeGoalStock(
      goals,
      inventory([{ upgradeId: "boon", amount: 30 }])
    )
    const reached = goals.map(
      (detail) =>
        computeGoalAttainment({
          detail,
          playerCharacter: undefined,
          playerMow: undefined,
          inventoryUpgrades: stock.get(detail.goalId),
          inventoryItems: [],
        }).reached
    )
    expect(reached).toEqual([true, false])
  })

  it("lets Active goals draw before a Paused one, whatever its position", () => {
    const stock = allocateUpgradeGoalStock(
      [
        upgradeGoal("paused", 1, boon(20), "Paused"),
        upgradeGoal("active", 2, boon(20)),
      ],
      inventory([{ upgradeId: "boon", amount: 25 }])
    )
    expect(stock.get("active")).toEqual([{ upgradeId: "boon", amount: 20 }])
    expect(stock.get("paused")).toEqual([{ upgradeId: "boon", amount: 5 }])
  })

  it("leaves Completed goals and unrelated materials out of the split", () => {
    const stock = allocateUpgradeGoalStock(
      [
        upgradeGoal("done", null, boon(27), "Completed"),
        upgradeGoal("other", 1, [{ upgradeId: "sword", quantity: 2 }]),
      ],
      inventory([
        { upgradeId: "boon", amount: 30 },
        { upgradeId: "sword", amount: 1 },
      ])
    )
    expect(stock.has("done")).toBe(false)
    expect(stock.get("other")).toEqual([{ upgradeId: "sword", amount: 1 }])
  })

  it("returns no entries while the inventory hasn't loaded", () => {
    expect(
      allocateUpgradeGoalStock([upgradeGoal("a", 1, boon(1))], undefined).size
    ).toBe(0)
  })
})
