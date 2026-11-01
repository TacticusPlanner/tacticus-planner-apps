import { describe, expect, it } from "vitest"
import { incursionsFixture } from "@workspace/game-catalog/testing"

import {
  bestPathShards,
  orderIncursions,
  parseReward,
  runSteps,
  shardYield,
  sumRewards,
  tierLabels,
  tierSummary,
  enhancementSubject,
  enemyStatRow,
} from "./incursions.model"

const broadside = incursionsFixture.find(
  (incursion) => incursion.mowId === "tauBroadside"
)!
const [common, mythic] = broadside.tiers

describe("parseReward", () => {
  it("reads fixed, ranged and bare rewards", () => {
    expect(parseReward("shards_tauBroadside:2")).toEqual({
      id: "shards_tauBroadside",
      min: 2,
      max: 2,
    })
    expect(parseReward("gold:20-25")).toEqual({ id: "gold", min: 20, max: 25 })
    expect(parseReward("upgArmU002")).toEqual({
      id: "upgArmU002",
      min: 1,
      max: 1,
    })
  })

  it("sums rewards by id in first-seen order", () => {
    expect(sumRewards(["gold:1-2", "upgA", "gold:3"])).toEqual([
      { id: "gold", min: 4, max: 5 },
      { id: "upgA", min: 1, max: 1 },
    ])
  })
})

describe("shardYield", () => {
  it("counts only the MoW's own shards", () => {
    expect(
      shardYield("tauBroadside", [
        "shards_tauBroadside:2",
        "shards_necroReanimator:5",
        "mythicShards_tauBroadside:4",
        "shards_tauBroadside",
      ])
    ).toEqual({ shards: 3, mythicShards: 4 })
  })
})

describe("bestPathShards", () => {
  it("takes the richest path through the shipped run maps", () => {
    expect(bestPathShards("tauBroadside", common!)).toEqual({
      shards: 32,
      mythicShards: 0,
    })
    expect(bestPathShards("tauBroadside", mythic!)).toEqual({
      shards: 18,
      mythicShards: 6,
    })
  })

  it("follows only one side of a choice", () => {
    const tier = {
      index: 0,
      rarity: "Common",
      battles: ["a", "b", "c"].map((id, at) => ({
        id,
        boardId: "B",
        challenge: false,
        difficultyMultiplier: 100,
        lightningVictoryTurns: null,
        baseRewards: [],
        starRewards: [`shards_x:${at + 1}`, "gold", "gold"],
        enemies: [],
      })),
      nodes: [
        node(0, 0, "a", []),
        node(1, 1, "b", [0], [2]),
        node(2, 1, "c", [0], [1]),
      ],
    }
    expect(bestPathShards("x", tier)).toEqual({ shards: 4, mythicShards: 0 })
  })
})

describe("runSteps", () => {
  it("groups nodes by depth and marks mutually exclusive picks", () => {
    const steps = runSteps(common!)
    expect(steps[0]).toMatchObject({ depth: 0, choice: false })
    expect(steps[1]?.nodes.map((node) => node.name)).toEqual(["2", "E"])
    expect(steps[1]?.choice).toBe(true)
    expect(steps.at(-1)?.depth).toBe(
      Math.max(...common!.nodes.map((n) => n.depth))
    )
  })
})

describe("tierSummary and labels", () => {
  it("counts the tier's parts", () => {
    expect(tierSummary("tauBroadside", mythic!)).toMatchObject({
      battles: 15,
      chests: 5,
      bestPath: { shards: 18, mythicShards: 6 },
    })
  })

  it("numbers tiers within their rarity", () => {
    const labels = tierLabels([
      { ...common!, index: 0 },
      { ...common!, index: 1 },
      { ...mythic!, index: 2 },
    ])
    expect([...labels.values()]).toEqual([
      { rarity: "Common", number: 1 },
      { rarity: "Common", number: 2 },
      { rarity: "Mythic", number: 1 },
    ])
  })
})

describe("orderIncursions", () => {
  it("puts the latest debut first", () => {
    expect(orderIncursions(incursionsFixture).map((i) => i.mowId)).toEqual([
      "necroReanimator",
      "tauBroadside",
    ])
  })
})

describe("enhancementSubject", () => {
  it("names the summoned unit or added trait", () => {
    expect(
      enhancementSubject({
        type: "Summons",
        abilityId: "EnhancementSummon:Havoc",
        unitAmount: null,
        stacks: true,
      })
    ).toBe("Havoc")
    expect(
      enhancementSubject({
        type: "Heal",
        abilityId: null,
        unitAmount: 3,
        stacks: false,
      })
    ).toBeUndefined()
  })
})

function node(
  index: number,
  depth: number,
  battleId: string,
  unlockedBy: number[],
  exclusiveWith: number[] = []
) {
  return {
    index,
    depth,
    kind: "battle" as const,
    name: battleId,
    battleId,
    enhancementId: null,
    chest: null,
    unlockedBy,
    exclusiveWith,
  }
}

describe("enemyStatRow", () => {
  const stats = ["a", "b", "c"]
  it("reads a regular npc's level as 0-based, capped at the last row", () => {
    expect(enemyStatRow({ id: "tauNpc1FireWarrior", stats }, 1)).toBe("b")
    expect(enemyStatRow({ id: "tauNpc1FireWarrior", stats }, 9)).toBe("c")
  })
  it("reads a boss's level as 1-based", () => {
    expect(enemyStatRow({ id: "tauNpcBossX", stats }, 1)).toBe("a")
  })
  it("has no row without stats", () => {
    expect(enemyStatRow({ id: "x", stats: [] }, 0)).toBeUndefined()
  })
})
