import { describe, expect, it } from "vitest"
import {
  battleIdSchema,
  campaignIdSchema,
  upgradeIdSchema,
} from "@workspace/game-domain"

import type { Battle, EstimateResourceId } from "@/entities/goal-farming"

import { buildFarmingInsights } from "./plan-farming-insights"

const battleId = battleIdSchema.parse
const resource = (id: string) => upgradeIdSchema.parse(id) as EstimateResourceId
const battle = (groupId: string, energyCost: number): Battle => ({
  campaignGroupId: campaignIdSchema.parse(groupId),
  type: "Normal",
  challenge: false,
  nodeNumber: 1,
  battleIndex: 0,
  energyCost,
  dailyAttempts: 99,
})
const drop = (node: string) => ({
  battleId: battleId(node),
  guaranteed: true,
  numerator: null,
  denominator: null,
  effectiveRate: null,
  isMythic: false,
})

// `common` (8 needed) drops at CHEAP (campaign1) and DEAR (campaign2); `rare` (2) only at DEAR.
const input = (battles: [string, Battle][]) => ({
  needs: [
    { id: resource("common"), count: 8 },
    { id: resource("rare"), count: 2 },
  ],
  upgradesById: new Map([
    [
      resource("common"),
      {
        id: resource("common"),
        rarity: "Common" as const,
        farmLocations: [drop("CHEAP"), drop("DEAR")],
      },
    ],
    [
      resource("rare"),
      {
        id: resource("rare"),
        rarity: "Legendary" as const,
        farmLocations: [drop("DEAR")],
      },
    ],
  ]),
  battlesById: new Map(
    battles.map(([id, value]) => [battleId(id), value] as const)
  ),
  isEventGroup: () => false,
  resolveLabel: () => "label",
  provenance: new Map([
    [resource("common"), new Set(["g1"])],
    [resource("rare"), new Set(["g2"])],
  ]),
  dailyEnergy: 100,
})

describe("buildFarmingInsights", () => {
  it("ranks by the share of needed items, then by energy per item", () => {
    const result = buildFarmingInsights(
      input([
        ["CHEAP", battle("campaign1", 5)],
        ["DEAR", battle("campaign2", 10)],
      ])
    )
    // campaign2 covers all 10 items; campaign1 only the 8 commons, though it is cheaper per item.
    expect(result.campaignInsights.map((insight) => insight.id)).toEqual([
      "campaign2:Normal",
      "campaign1:Normal",
    ])
    expect(
      result.farmingSpotsByInsightId.get("campaign2:Normal")
    ).toMatchObject({ itemCount: 10, coverage: 1, energy: 100 })
    expect(
      result.benefitingGoalIdsByInsightId
        .get("campaign2:Normal")
        ?.toSorted((a, b) => a.localeCompare(b))
    ).toEqual(["g1", "g2"])
  })

  it("breaks a coverage tie with the lower energy per item", () => {
    const result = buildFarmingInsights(
      input([
        ["CHEAP", battle("campaign1", 5)],
        ["DEAR", battle("campaign2", 10)],
      ])
    )
    const onlyCommon = buildFarmingInsights({
      ...input([
        ["CHEAP", battle("campaign1", 5)],
        ["DEAR", battle("campaign2", 10)],
      ]),
      needs: [{ id: resource("common"), count: 8 }],
    })
    expect(result.campaignInsights).toHaveLength(2)
    expect(onlyCommon.campaignInsights.map((insight) => insight.id)).toEqual([
      "campaign1:Normal",
      "campaign2:Normal",
    ])
  })
})
