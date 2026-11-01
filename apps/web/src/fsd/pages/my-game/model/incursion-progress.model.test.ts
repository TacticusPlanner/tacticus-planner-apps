import { describe, expect, it } from "vitest"
import { incursionsFixture } from "@workspace/game-catalog/testing"

import {
  battleKey,
  clearedTierCount,
  nextTierIndex,
  remainingShards,
  sameIncursionProgress,
  starsFor,
  tierChestRewards,
  tierCleared,
  tierUnclaimedRewards,
  toIncursionProgressDraft,
  toIncursionProgressPayload,
  unclaimedStarRewards,
  type IncursionProgressDraft,
} from "./incursion-progress.model"

// The fixture keeps only tiers 0 and 12 (Common 1 and Mythic 1); each has 12 or 15 battles.
const broadside = incursionsFixture.find(
  (incursion) => incursion.mowId === "tauBroadside"
)!
const [common1, mythic1] = broadside.tiers as [
  (typeof broadside.tiers)[number],
  (typeof broadside.tiers)[number],
]

const starsOf = (draft: IncursionProgressDraft) =>
  starsFor(draft, "tauBroadside")

describe("incursion progress drafts", () => {
  it("round-trips saved stars and drops zero entries from the payload", () => {
    const saved = {
      battles: [
        { mowId: "tauBroadside", tierIndex: 12, battleId: "1", stars: 3 },
        { mowId: "tauBroadside", tierIndex: 0, battleId: "1", stars: 1 },
      ],
      revision: 7,
    }
    const draft = {
      ...toIncursionProgressDraft(saved),
      [battleKey("necroReanimator", 0, "2")]: 0,
    }
    expect(draft).toEqual({
      "tauBroadside|12|1": 3,
      "tauBroadside|0|1": 1,
      "necroReanimator|0|2": 0,
    })
    expect(toIncursionProgressPayload(draft, saved)).toEqual(saved)
  })

  it("treats a missing battle as zero stars when comparing", () => {
    expect(sameIncursionProgress({ a: 0 }, {})).toBe(true)
    expect(sameIncursionProgress({ a: 1 }, {})).toBe(false)
  })
})

describe("tierCleared", () => {
  it("counts a tier once a battle on its last battle step has a star, in any order", () => {
    const lastOnly = starsOf({ [battleKey("tauBroadside", 12, "15")]: 1 })
    expect(tierCleared(mythic1, lastOnly)).toBe(true)
    expect(tierCleared(common1, lastOnly)).toBe(false)
    expect(clearedTierCount(broadside, lastOnly)).toBe(1)
    expect(nextTierIndex(broadside, lastOnly)).toBe(0)

    const midOnly = starsOf({ [battleKey("tauBroadside", 0, "11")]: 3 })
    expect(tierCleared(common1, midOnly)).toBe(false)
  })

  it("opens the last tier once every tier is cleared", () => {
    const both = starsOf({
      [battleKey("tauBroadside", 0, "12")]: 2,
      [battleKey("tauBroadside", 12, "15")]: 1,
    })
    expect(clearedTierCount(broadside, both)).toBe(2)
    expect(nextTierIndex(broadside, both)).toBe(12)
  })
})

describe("one-time rewards", () => {
  it("keeps only the star rewards not yet earned", () => {
    expect(unclaimedStarRewards(["a", "b", "c"], 0)).toEqual(["a", "b", "c"])
    expect(unclaimedStarRewards(["a", "b", "c"], 2)).toEqual(["c"])
    expect(unclaimedStarRewards(["a", "b", "c"], 3)).toEqual([])
  })

  it("sums the star-reward shards still on offer across all tiers", () => {
    expect(remainingShards(broadside, () => 0)).toEqual({
      shards: 41,
      mythicShards: 0,
    })
    // Battle 7 of Common 1 pays 2 shards for its 2nd star and 3 more for its 3rd.
    const twoStars = starsOf({ [battleKey("tauBroadside", 0, "7")]: 2 })
    expect(remainingShards(broadside, twoStars)).toEqual({
      shards: 39,
      mythicShards: 0,
    })
    expect(tierUnclaimedRewards(common1, twoStars)).not.toContain("upgDmgC008")
    expect(remainingShards(broadside, () => 3)).toEqual({
      shards: 0,
      mythicShards: 0,
    })
  })

  it("lists the chests a replay pays again", () => {
    expect(tierChestRewards(mythic1)).toContain("mythicShards_tauBroadside:3")
    expect(tierChestRewards(common1)).toHaveLength(12)
  })
})
