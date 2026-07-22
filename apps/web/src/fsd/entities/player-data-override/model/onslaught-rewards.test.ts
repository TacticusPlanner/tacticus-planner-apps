import { describe, expect, it } from "vitest"
import type { OnslaughtRewardStorageModel } from "@workspace/game-catalog"

import { onslaughtReward } from "./onslaught-rewards"

const rewards: OnslaughtRewardStorageModel[] = [
  {
    id: "Stone-2",
    sector: "Stone",
    tier: 2,
    regular: Array(5).fill({ min: 2, max: 4 }),
    mythic: { min: 1, max: 1 },
  },
  {
    id: "Gold-3",
    sector: "Gold",
    tier: 3,
    regular: [
      { min: 3, max: 4 },
      { min: 4, max: 5 },
      { min: 6, max: 7 },
      { min: 10, max: 11 },
      { min: 16, max: 18 },
    ],
    mythic: { min: 1, max: 1 },
  },
  {
    id: "Diamond-1",
    sector: "Diamond",
    tier: 1,
    regular: Array(5).fill({ min: 1, max: 1 }),
    mythic: { min: 1, max: 2 },
  },
  {
    id: "Adamantine-3",
    sector: "Adamantine",
    tier: 3,
    regular: Array(5).fill({ min: 1, max: 1 }),
    mythic: { min: 2, max: 3 },
  },
]

describe("onslaughtReward", () => {
  it("matches V1 regular shard ranges across early and late sectors", () => {
    expect(onslaughtReward(rewards, "Stone", 2, "Epic")).toEqual({
      min: 2,
      max: 4,
      mythic: false,
    })
    expect(onslaughtReward(rewards, "Gold", 3, "Legendary")).toEqual({
      min: 16,
      max: 18,
      mythic: false,
    })
    expect(onslaughtReward(rewards, "Gold", 4, "Legendary")).toEqual({
      min: 16,
      max: 18,
      mythic: false,
    })
  })

  it("matches V1 mythic shard ranges", () => {
    expect(onslaughtReward(rewards, "Diamond", 1, "LegendaryBlue")).toEqual({
      min: 1,
      max: 2,
      mythic: true,
    })
    expect(onslaughtReward(rewards, "Adamantine", 3, "Mythic")).toEqual({
      min: 2,
      max: 3,
      mythic: true,
    })
  })
})
