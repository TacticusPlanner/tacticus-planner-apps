import { describe, expect, it } from "vitest"
import type { BattleId, UnitId, UpgradeId } from "@workspace/game-domain"

import {
  buildResourceSources,
  planCellAlternatives,
} from "./plan-cell-alternatives"

const battle = (id: string) => id as BattleId
const shopVariant = (type: string, qty: number, amount: number) => ({
  reward: { type, qty },
  cost: { currency: "coins", amount },
})

describe("buildResourceSources", () => {
  it("indexes campaign nodes per upgrade and shard resource, deduped and catalog-only", () => {
    const sources = buildResourceSources({
      upgrades: [
        {
          id: "U1" as UpgradeId,
          farmLocations: [
            { battleId: battle("B2") },
            { battleId: battle("B1") },
            { battleId: battle("B2") },
            { battleId: battle("unknown") },
          ],
        },
      ],
      characters: [
        {
          id: "calgar" as UnitId,
          shardLocations: [
            { battleId: battle("B3"), isMythic: false },
            { battleId: battle("E1"), isMythic: true },
          ],
        },
      ],
      shops: [],
      knownBattleIds: new Set(["B1", "B2", "B3", "E1"].map(battle)),
    })

    expect(sources.get("U1")).toEqual({ battleIds: ["B2", "B1"], shops: [] })
    expect(sources.get("shard:calgar")?.battleIds).toEqual(["B3"])
    expect(sources.get("mythic-shard:calgar")?.battleIds).toEqual(["E1"])
  })

  it("lists each shop selling a resource once, at its cheapest price per item", () => {
    const sources = buildResourceSources({
      upgrades: [],
      characters: [],
      shops: [
        {
          id: "guild",
          slots: [
            { variants: [shopVariant("shards_calgar", 5, 500)] },
            { variants: [shopVariant("shards_calgar", 10, 600)] },
          ],
        },
        { id: "arena", slots: [{ variants: [shopVariant("U1", 1, 50)] }] },
      ],
      knownBattleIds: new Set(),
    })

    expect(sources.get("shard:calgar")).toEqual({
      battleIds: [],
      shops: [{ shopId: "guild", rewardQty: 10, currency: "coins", cost: 600 }],
    })
    expect(sources.get("U1")?.shops).toEqual([
      { shopId: "arena", rewardQty: 1, currency: "coins", cost: 50 },
    ])
  })
})

describe("planCellAlternatives", () => {
  const sources = new Map([
    [
      "U1",
      {
        battleIds: ["B1", "B2", "E1", "B3", "E2", "B4"].map(battle),
        shops: [{ shopId: "arena", rewardQty: 1, currency: "coins", cost: 50 }],
      },
    ],
  ])
  const isEvent = (battleId: BattleId) => battleId.startsWith("E")

  it("splits unplanned nodes into campaigns and events, raidable before locked", () => {
    const result = planCellAlternatives(
      {
        resourceId: "U1",
        nodes: [{ battleId: battle("B2"), raidsPerformed: 3 }],
      },
      sources,
      new Set(["B2", "B4", "E2"].map(battle)),
      isEvent
    )

    expect(result.campaigns).toEqual([
      { battleId: "B4", locked: false },
      { battleId: "B1", locked: true },
      { battleId: "B3", locked: true },
    ])
    expect(result.events).toEqual([
      { battleId: "E2", locked: false },
      { battleId: "E1", locked: true },
    ])
    expect(result.shops).toEqual([
      { shopId: "arena", rewardQty: 1, currency: "coins", cost: 50 },
    ])
  })

  it("returns empty groups for a resource without catalog sources", () => {
    expect(
      planCellAlternatives(
        { resourceId: "shard:x", nodes: [] },
        sources,
        new Set(),
        isEvent
      )
    ).toEqual({ campaigns: [], events: [], shops: [] })
  })
})
