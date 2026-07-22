import { describe, expect, it } from "vitest"
import { battleIdSchema, campaignIdSchema } from "@workspace/game-domain"

import type { Battle, FarmLocation } from "./estimate/estimate.domain"
import { estimateRemainingShardEnergy } from "./shard-energy-estimate"

const battleId = battleIdSchema.parse
const campaignId = campaignIdSchema.parse

const battle: Battle = {
  campaignGroupId: campaignId("campaign1"),
  type: "Normal",
  challenge: false,
  nodeNumber: 1,
  energyCost: 10,
  dailyAttempts: 999,
}
const battlesById = new Map([[battleId("B1"), battle]])

function location(
  battleIdValue: string,
  overrides: Partial<FarmLocation> = {}
): FarmLocation {
  return {
    battleId: battleId(battleIdValue),
    guaranteed: true,
    numerator: null,
    denominator: null,
    effectiveRate: null,
    isMythic: false,
    ...overrides,
  }
}

describe("estimateRemainingShardEnergy", () => {
  it("returns null when there are no remaining shards to farm", () => {
    const outcome = estimateRemainingShardEnergy({
      entityId: "hero1",
      remainingShards: 0,
      shardLocations: [location("B1")],
      battlesById,
      farmingLocationIds: [],
      dailyEnergy: 288,
    })

    expect(outcome).toBeNull()
  })

  it("estimates the energy for a guaranteed-drop location — one raid per shard at the node's energy cost", () => {
    const outcome = estimateRemainingShardEnergy({
      entityId: "hero1",
      remainingShards: 5,
      shardLocations: [location("B1")],
      battlesById,
      farmingLocationIds: [],
      dailyEnergy: 288,
    })

    expect(outcome).toMatchObject({ status: "Estimated", energyTotal: 50 })
  })

  it("restricts the energy calculation to the selected locations, blocking when none of them can farm the shard", () => {
    const shardLocations = [location("B1"), location("B2")]
    const twoBattles = new Map([
      [battleId("B1"), battle],
      [battleId("B2"), { ...battle, energyCost: 5 }],
    ])

    // Unrestricted: picks B2, the cheaper node.
    const unrestricted = estimateRemainingShardEnergy({
      entityId: "hero1",
      remainingShards: 4,
      shardLocations,
      battlesById: twoBattles,
      farmingLocationIds: [],
      dailyEnergy: 288,
    })
    expect(unrestricted).toMatchObject({ status: "Estimated", energyTotal: 20 })

    // Restricted to only B1 (the pricier node) — same shard count now costs more energy.
    const restrictedToExpensive = estimateRemainingShardEnergy({
      entityId: "hero1",
      remainingShards: 4,
      shardLocations,
      battlesById: twoBattles,
      farmingLocationIds: ["B1"],
      dailyEnergy: 288,
    })
    expect(restrictedToExpensive).toMatchObject({
      status: "Estimated",
      energyTotal: 40,
    })

    // Restricted to a location with no drop data for this shard at all — nothing left to farm from.
    const restrictedToNone = estimateRemainingShardEnergy({
      entityId: "hero1",
      remainingShards: 4,
      shardLocations,
      battlesById: twoBattles,
      farmingLocationIds: ["not-a-real-battle"],
      dailyEnergy: 288,
    })
    expect(restrictedToNone).toMatchObject({ status: "Blocked" })
  })
})
