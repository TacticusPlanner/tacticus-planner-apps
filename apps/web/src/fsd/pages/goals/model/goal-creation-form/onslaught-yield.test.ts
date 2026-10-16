import { describe, expect, it } from "vitest"
import type { OnslaughtRewardStorageModel } from "@workspace/game-catalog"

import type { OnslaughtProgress } from "@/entities/player-data-override"

import {
  isOnslaughtProgressSaved,
  onslaughtRewardKeyForProgression,
  onslaughtShardsPerRun,
} from "./onslaught-yield"

describe("onslaughtRewardKeyForProgression", () => {
  it("uses the current rarity's regular reward below the Mythic tier", () => {
    expect(onslaughtRewardKeyForProgression("Legendary:OneBlueStar")).toBe(
      "Legendary"
    )
    expect(onslaughtRewardKeyForProgression("Rare:TwoStars")).toBe("Rare")
  })

  it("uses the Mythic reward once the current progression is in the Mythic tier", () => {
    expect(onslaughtRewardKeyForProgression("Mythic:OneStar")).toBe("Mythic")
  })

  it("does not consider the goal target — a below-Mythic current tier stays regular (align-acquisition-source-yield-estimates)", () => {
    // Same character, current progression well below Mythic: the key never flips to Mythic
    // regardless of how far the goal's target reaches.
    expect(onslaughtRewardKeyForProgression("Epic:ThreeStars")).toBe("Epic")
  })
})

const rewards: OnslaughtRewardStorageModel[] = [
  {
    id: "Gold-3",
    sector: "Gold",
    tier: 3,
    regular: [
      { min: 1, max: 1 },
      { min: 2, max: 2 },
      { min: 3, max: 3 },
      { min: 4, max: 4 },
      { min: 5, max: 7 },
    ],
    mythic: { min: 1, max: 3 },
  },
]

const progress: OnslaughtProgress = {
  imperial: { sector: "Gold", tier: 4, isSet: true },
  xenos: { sector: "Stone", tier: 1, isSet: true },
  chaos: { sector: "Gold", tier: 3, isSet: true },
  revision: 1,
}

describe("onslaughtShardsPerRun", () => {
  it("averages the reward range for the alliance's saved position", () => {
    // Imperial is Gold 4 (sector complete), which uses the tier-3 row.
    expect(
      onslaughtShardsPerRun({
        progress,
        rewards,
        alliance: "Imperial",
        currentProgression: "Legendary:RedFourStars",
      })
    ).toEqual({ shardsPerRun: 6, available: true, progressSet: true })
  })

  it("uses the mythic range once the current progression is Mythic", () => {
    expect(
      onslaughtShardsPerRun({
        progress,
        rewards,
        alliance: "Chaos",
        currentProgression: "Mythic:OneBlueStar",
      })
    ).toEqual({ shardsPerRun: 2, available: true, progressSet: true })
  })

  it("is unavailable when the saved position has no reward row", () => {
    expect(
      onslaughtShardsPerRun({
        progress,
        rewards,
        alliance: "Xenos",
        currentProgression: "Rare:FourStars",
      })
    ).toEqual({ shardsPerRun: 0, available: false, progressSet: true })
  })

  it("reports an alliance the player never saved instead of yielding its Stone 1 placeholder", () => {
    expect(
      onslaughtShardsPerRun({
        progress: {
          ...progress,
          chaos: { sector: "Stone", tier: 1, isSet: false },
        },
        rewards,
        alliance: "Chaos",
        currentProgression: "Legendary:RedFourStars",
      })
    ).toEqual({ shardsPerRun: 0, available: false, progressSet: false })
  })
})

describe("isOnslaughtProgressSaved", () => {
  const unset = { sector: "Stone", tier: 1, isSet: false } as const

  it("is false before the progress query resolves", () => {
    expect(isOnslaughtProgressSaved(undefined, "Imperial")).toBe(false)
  })

  it("is false for an alliance the API reports as unset", () => {
    expect(
      isOnslaughtProgressSaved({ ...progress, xenos: unset }, "Xenos")
    ).toBe(false)
  })

  it("is true for a saved alliance, including a saved Stone 1", () => {
    expect(isOnslaughtProgressSaved(progress, "Xenos")).toBe(true)
  })

  it("falls back to Imperial when the unit's alliance is unknown", () => {
    expect(
      isOnslaughtProgressSaved({ ...progress, imperial: unset }, undefined)
    ).toBe(false)
  })
})
