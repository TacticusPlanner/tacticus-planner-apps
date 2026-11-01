import { describe, expect, it } from "vitest"
import type { MowStorageModel } from "@workspace/game-catalog"

import type { GoalDetail } from "@/entities/goal"

import { computeGoalAttainment } from "./goal-attainment"
import {
  allocateUpgradeGoalStock,
  type UpgradeStockUnits,
} from "./upgrade-goal-stock"

function upgradeGoal(
  goalId: string,
  globalPriority: number | null,
  targets: { upgradeId: string; quantity: number }[],
  status = "Active",
  extra: { entityId?: string; rankRange?: { start: number; end: number } } = {}
) {
  return {
    goalId,
    status,
    globalPriority,
    entityType: "Character",
    entityId: extra.entityId ?? goalId,
    goalType: "Upgrade",
    config: {
      upgrade: { targets, rankRange: extra.rankRange ?? null },
    },
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

// "ahriman": Stone1 holds two Boons and another item, Stone2 one Boon — a Stone1 → Stone3 Rank goal
// fills three Boon slots. "forgefiend" (a Machine of War): each of its first two primary levels takes
// one Boon.
const units: UpgradeStockUnits = {
  getCharacter: (unitId) =>
    unitId === "ahriman"
      ? ({
          id: unitId,
          name: "Ahriman",
          rankUpUpgrades: [
            { rank: "Stone1", upgradeIds: ["boon", "boon", "other"] },
            { rank: "Stone2", upgradeIds: ["boon"] },
          ],
        } as never)
      : undefined,
  getMow: (unitId) =>
    unitId === "forgefiend"
      ? ({
          primaryAbility: { recipes: [["boon"], ["boon"]] },
          secondaryAbility: { recipes: [] },
        } as unknown as MowStorageModel)
      : undefined,
  playerCharacterById: new Map(),
  playerMowById: new Map(),
}

const rankGoal = (goalId: string, globalPriority: number) =>
  ({
    goalId,
    status: "Active",
    globalPriority,
    entityType: "Character",
    entityId: "ahriman",
    goalType: "Rank",
    config: {
      rank: {
        start: 0,
        startPointFive: false,
        startAppliedUpgrades: 0,
        end: 2,
        endPointFive: false,
        endAppliedUpgrades: 0,
      },
    },
  }) as GoalDetail

const mowAbilityGoal = (globalPriority: number) =>
  ({
    goalId: "forgefiend-ability",
    status: "Active",
    globalPriority,
    entityType: "Mow",
    entityId: "forgefiend",
    goalType: "Ability",
    config: {
      ability: { activeStart: 1, activeEnd: 3, passiveStart: 1, passiveEnd: 1 },
    },
  }) as GoalDetail

describe("allocateUpgradeGoalStock with Rank and Machine of War Ability goals", () => {
  it("lets a higher-priority Rank goal on another unit take its pieces first", () => {
    const stock = allocateUpgradeGoalStock(
      [rankGoal("rank", 1), upgradeGoal("abraxas", 2, boon(2))],
      inventory([{ upgradeId: "boon", amount: 4 }]),
      units
    )
    expect(stock.get("abraxas")).toEqual([{ upgradeId: "boon", amount: 1 }])
  })

  it("lets a higher-priority Machine of War Ability goal take its pieces first", () => {
    const stock = allocateUpgradeGoalStock(
      [mowAbilityGoal(1), upgradeGoal("abraxas", 2, boon(1))],
      inventory([{ upgradeId: "boon", amount: 2 }]),
      units
    )
    expect(stock.get("abraxas")).toEqual([{ upgradeId: "boon", amount: 0 }])
  })

  it("counts a same-unit Rank goal's pieces toward an Upgrade goal over the same slots", () => {
    const stock = allocateUpgradeGoalStock(
      [
        rankGoal("rank", 1),
        upgradeGoal("ahriman-items", 2, boon(3), "Active", {
          entityId: "ahriman",
          rankRange: { start: 0, end: 2 },
        }),
      ],
      inventory([{ upgradeId: "boon", amount: 3 }]),
      units
    )
    expect(stock.get("ahriman-items")).toEqual([
      { upgradeId: "boon", amount: 3 },
    ])
  })

  it("doesn't let a lower-priority Rank goal draw slots a same-unit Upgrade goal already filled", () => {
    const stock = allocateUpgradeGoalStock(
      [
        upgradeGoal("ahriman-items", 1, boon(3), "Active", {
          entityId: "ahriman",
          rankRange: { start: 0, end: 2 },
        }),
        rankGoal("rank", 2),
        upgradeGoal("abraxas", 3, boon(1)),
      ],
      inventory([{ upgradeId: "boon", amount: 4 }]),
      units
    )
    expect(stock.get("ahriman-items")).toEqual([
      { upgradeId: "boon", amount: 3 },
    ])
    expect(stock.get("abraxas")).toEqual([{ upgradeId: "boon", amount: 1 }])
  })

  it("keeps an Upgrade goal without a range additive to a same-unit Rank goal", () => {
    const stock = allocateUpgradeGoalStock(
      [
        rankGoal("rank", 1),
        upgradeGoal("ahriman-extra", 2, boon(2), "Active", {
          entityId: "ahriman",
        }),
      ],
      inventory([{ upgradeId: "boon", amount: 4 }]),
      units
    )
    expect(stock.get("ahriman-extra")).toEqual([
      { upgradeId: "boon", amount: 1 },
    ])
  })
})
