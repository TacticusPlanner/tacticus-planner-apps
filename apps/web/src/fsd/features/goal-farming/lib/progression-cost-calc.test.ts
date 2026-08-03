import { describe, expect, it } from "vitest"
import type {
  AscensionCostStorageModel,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"

import {
  ascensionResourceNeed,
  isMythicProgression,
  unlockResourceNeed,
} from "./progression-cost-calc"

const ascensionCostsById = new Map<string, AscensionCostStorageModel>([
  [
    "Common:None",
    {
      id: "Common:None",
      progression: "Common:None",
      shards: 0,
      mythicShards: 0,
      orbs: 0,
      orbRarity: null,
    },
  ],
  [
    "Common:OneStar",
    {
      id: "Common:OneStar",
      progression: "Common:OneStar",
      shards: 10,
      mythicShards: 0,
      orbs: 0,
      orbRarity: null,
    },
  ],
  [
    "Common:TwoStars",
    {
      id: "Common:TwoStars",
      progression: "Common:TwoStars",
      shards: 15,
      mythicShards: 0,
      orbs: 0,
      orbRarity: null,
    },
  ],
  [
    "Uncommon:TwoStars",
    {
      id: "Uncommon:TwoStars",
      progression: "Uncommon:TwoStars",
      shards: 15,
      mythicShards: 0,
      orbs: 10,
      orbRarity: "Uncommon",
    },
  ],
])

const unlockShardCostsById = new Map<string, UnlockShardCostStorageModel>([
  ["Common", { id: "Common", rarity: "Common", shards: 40 }],
  ["Legendary", { id: "Legendary", rarity: "Legendary", shards: 500 }],
])

describe("ascensionResourceNeed", () => {
  it("sums shards and orbs across every crossed step, net of owned shards", () => {
    const need = ascensionResourceNeed({
      start: "Common:None",
      end: "Uncommon:TwoStars",
      entityId: "hero1",
      isMow: false,
      ownedShards: 5,
      ownedMythicShards: 0,
      ascensionCostsById,
    })

    // 10 (OneStar) + 15 (TwoStars) + 15 (Uncommon:TwoStars) = 40, net 5 owned = 35.
    expect(need.shards).toBe(35)
    expect(need.orbsByType).toEqual({ Uncommon: 10 })
    expect(need.shardId).toBe("shard:hero1")
  })

  it("returns an empty need for an inverted or empty range", () => {
    const need = ascensionResourceNeed({
      start: "Common:TwoStars",
      end: "Common:TwoStars",
      entityId: "hero1",
      isMow: false,
      ownedShards: 0,
      ownedMythicShards: 0,
      ascensionCostsById,
    })

    expect(need.shards).toBe(0)
    expect(need.shardId).toBeNull()
  })

  it("never sets shardId for a MoW (no shardLocations to farm from)", () => {
    const need = ascensionResourceNeed({
      start: "Common:None",
      end: "Common:TwoStars",
      entityId: "mow1",
      isMow: true,
      ownedShards: 0,
      ownedMythicShards: 0,
      ascensionCostsById,
    })

    expect(need.shards).toBeGreaterThan(0)
    expect(need.shardId).toBeNull()
  })

  it("fully nets out when owned shards cover the whole crossed range", () => {
    const need = ascensionResourceNeed({
      start: "Common:None",
      end: "Common:TwoStars",
      entityId: "hero1",
      isMow: false,
      ownedShards: 999,
      ownedMythicShards: 0,
      ascensionCostsById,
    })

    expect(need.shards).toBe(0)
    expect(need.shardId).toBeNull()
  })
})

describe("unlockResourceNeed", () => {
  it("looks up the shard cost by the character's starting rarity, net of owned shards", () => {
    const need = unlockResourceNeed({
      initialRarity: "Legendary",
      entityId: "hero1",
      isMow: false,
      ownedShards: 100,
      unlockShardCostsById,
    })

    expect(need.shards).toBe(400)
    expect(need.shardId).toBe("shard:hero1")
  })

  it("returns an empty need for a MoW (no rarity field to key the table by)", () => {
    const need = unlockResourceNeed({
      initialRarity: "Rare",
      entityId: "mow1",
      isMow: true,
      ownedShards: 0,
      unlockShardCostsById,
    })

    expect(need.shards).toBe(0)
    expect(need.shardId).toBeNull()
  })

  it("returns an empty need when the rarity isn't in the catalog table", () => {
    const need = unlockResourceNeed({
      initialRarity: undefined,
      entityId: "hero1",
      isMow: false,
      ownedShards: 0,
      unlockShardCostsById,
    })

    expect(need.shards).toBe(0)
  })
})

describe("isMythicProgression", () => {
  it("is true once progression reaches the Mythic tier", () => {
    expect(isMythicProgression("Mythic:OneBlueStar")).toBe(true)
    expect(isMythicProgression("Mythic:MythicWings")).toBe(true)
  })

  it("is false for every pre-Mythic tier", () => {
    expect(isMythicProgression("Common:None")).toBe(false)
    expect(isMythicProgression("Legendary:OneBlueStar")).toBe(false)
  })
})
