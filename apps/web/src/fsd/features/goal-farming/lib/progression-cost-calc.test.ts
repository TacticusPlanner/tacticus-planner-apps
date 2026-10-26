import { describe, expect, it } from "vitest"
import type {
  AscensionCostStorageModel,
  UnlockShardCostStorageModel,
} from "@workspace/game-catalog"
import type { Progression } from "@workspace/game-domain"

import {
  ascensionResourceNeed,
  createAscensionCoverage,
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
      owned: false,
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
      owned: false,
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
      owned: false,
      ownedShards: 0,
      unlockShardCostsById,
    })

    expect(need.shards).toBe(0)
  })

  it("is zero once the character is owned, even with the same catalog cost and shard inventory that would otherwise net to a nonzero need", () => {
    const notOwned = unlockResourceNeed({
      initialRarity: "Common",
      entityId: "hero1",
      isMow: false,
      owned: false,
      ownedShards: 5,
      unlockShardCostsById,
    })
    expect(notOwned.shards).toBe(35)

    const owned = unlockResourceNeed({
      initialRarity: "Common",
      entityId: "hero1",
      isMow: false,
      owned: true,
      ownedShards: 5,
      unlockShardCostsById,
    })
    expect(owned.shards).toBe(0)
    expect(owned.shardId).toBeNull()
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

describe("ascensionResourceNeed plan coverage", () => {
  const step = (
    progression: Progression,
    shards: number,
    orbs: number
  ): [string, AscensionCostStorageModel] => [
    progression,
    {
      id: progression,
      progression,
      shards,
      mythicShards: 0,
      orbs,
      orbRarity: "Legendary",
    },
  ]
  const legendaryCosts = new Map<string, AscensionCostStorageModel>([
    step("Legendary:RedThreeStars", 100, 10),
    step("Legendary:RedFourStars", 150, 10),
    step("Legendary:RedFiveStars", 250, 15),
    step("Legendary:OneBlueStar", 500, 20),
  ])
  const ragnar = (end: string) => ({
    start: "Epic:RedThreeStars",
    end,
    entityId: "ragnar",
    isMow: false,
    ownedShards: 40,
    ownedMythicShards: 0,
    currentProgression: "Epic:RedThreeStars",
    ascensionCostsById: legendaryCosts,
  })

  it("charges overlapping milestones once and draws owned shards once (worked Ragnar example)", () => {
    const allocation = createAscensionCoverage()

    const first = ascensionResourceNeed({
      ...ragnar("Legendary:RedFourStars"),
      coverage: { goalId: "p1", allocation },
    })
    const second = ascensionResourceNeed({
      ...ragnar("Legendary:OneBlueStar"),
      coverage: { goalId: "p2", allocation },
    })

    expect(first.shards).toBe(210)
    expect(first.orbsByType).toEqual({ Legendary: 20 })
    expect(second.shards).toBe(750)
    expect(second.orbsByType).toEqual({ Legendary: 35 })
    expect(first.shards + second.shards).toBe(960)
  })

  it("reads back the same allocation when a goal's need is computed again", () => {
    const allocation = createAscensionCoverage()
    const first = (owned: number) =>
      ascensionResourceNeed({
        ...ragnar("Legendary:RedFourStars"),
        ownedShards: owned,
        coverage: { goalId: "p1", allocation },
      })

    expect(first(40).shards).toBe(210)
    // A gross-demand pass (owned stock zeroed) neither loses the steps nor the recorded draw.
    expect(first(0).shards).toBe(250)
    expect(first(40).shards).toBe(210)
    expect(
      ascensionResourceNeed({
        ...ragnar("Legendary:OneBlueStar"),
        coverage: { goalId: "p2", allocation },
      }).shards
    ).toBe(750)
  })

  it("charges every step to a higher target ordered first, leaving the lower one nothing", () => {
    const allocation = createAscensionCoverage()

    const higher = ascensionResourceNeed({
      ...ragnar("Legendary:OneBlueStar"),
      coverage: { goalId: "p1", allocation },
    })
    const lower = ascensionResourceNeed({
      ...ragnar("Legendary:RedFourStars"),
      coverage: { goalId: "p2", allocation },
    })

    expect(higher.shards).toBe(960)
    expect(lower.shards).toBe(0)
    expect(lower.orbsByType).toEqual({})
  })

  it("leaves a standalone estimate charging its whole range net of all owned shards", () => {
    const standalone = ascensionResourceNeed(ragnar("Legendary:OneBlueStar"))

    expect(standalone.shards).toBe(960)
    expect(standalone.orbsByType).toEqual({ Legendary: 55 })
  })
})
