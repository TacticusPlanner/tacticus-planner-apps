import { describe, expect, it } from "vitest"
import {
  battleIdSchema,
  campaignIdSchema,
  upgradeIdSchema,
} from "@workspace/game-domain"

import type { CampaignInsight } from "@/features/campaign-insights/@x/goal-planning"
import type {
  Battle,
  EstimateResourceId,
} from "@/features/goal-farming/@x/goal-planning"

import { summarizeFarmingSpots } from "./plan-farming-spots"

const battleId = battleIdSchema.parse
const campaign = campaignIdSchema.parse("campaign1")
const battle = (energyCost: number): Battle => ({
  campaignGroupId: campaign,
  type: "Normal",
  challenge: false,
  nodeNumber: 1,
  battleIndex: 0,
  energyCost,
  dailyAttempts: 3,
})

const contribution = (
  upgradeId: string,
  node: string,
  count: number,
  dropRate: number
) => ({
  upgradeId: upgradeIdSchema.parse(upgradeId) as EstimateResourceId,
  battleId: battleId(node),
  campaignGroupId: campaign,
  type: "Normal",
  challenge: false,
  nodeNumber: 1,
  count,
  dropRate,
  value: count * dropRate,
})

describe("summarizeFarmingSpots", () => {
  it("sums each resource's need per node and prices it at the campaign's cheapest node for it", () => {
    const insight: CampaignInsight<EstimateResourceId> = {
      id: "campaign1:Normal",
      label: "Campaign One",
      score: 1,
      contributions: [
        // mat1: two goals' needs (2 + 2) at B1 (1/2 drop, 6 energy) or B2 (guaranteed, 10 energy).
        contribution("mat1", "B1", 2, 0.5),
        contribution("mat1", "B1", 2, 0.5),
        contribution("mat1", "B2", 2, 1),
        contribution("mat1", "B2", 2, 1),
        // mat2 only drops at B1.
        contribution("mat2", "B1", 1, 0.5),
      ],
    }

    const spots = summarizeFarmingSpots(
      [insight],
      new Map([
        [battleId("B1"), battle(6)],
        [battleId("B2"), battle(10)],
      ]),
      24
    )

    // mat1: B1 = 8 runs × 6 = 48, B2 = 4 runs × 10 = 40 → 40. mat2: 2 runs × 6 = 12.
    expect(spots.get("campaign1:Normal")).toEqual({
      resourceCount: 2,
      energy: 52,
      days: 52 / 24,
    })
  })

  it("never reports fewer days than the node's daily attempts allow", () => {
    const insight: CampaignInsight<EstimateResourceId> = {
      id: "campaign1:Elite",
      label: "Campaign One Elite",
      score: 1,
      // 20 guaranteed runs at a 3-attempt node: 7 days, though the energy fits in one.
      contributions: [contribution("mat1", "B1", 20, 1)],
    }

    const spot = summarizeFarmingSpots(
      [insight],
      new Map([[battleId("B1"), battle(6)]]),
      288
    ).get("campaign1:Elite")

    expect(spot?.energy).toBe(120)
    expect(spot?.days).toBeCloseTo(20 / 3)
  })
})
