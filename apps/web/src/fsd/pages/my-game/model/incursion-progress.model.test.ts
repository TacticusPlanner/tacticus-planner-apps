import { describe, expect, it } from "vitest"
import { incursionsFixture } from "@workspace/game-catalog/testing"

import {
  nextTierIndex,
  remainingShards,
  sameIncursionProgress,
  toIncursionProgressDraft,
  toIncursionProgressPayload,
} from "./incursion-progress.model"

const broadside = incursionsFixture.find(
  (incursion) => incursion.mowId === "tauBroadside"
)!
// The fixture keeps only tiers 0 and 12 (Common 1 and Mythic 1), so progress counts positions.
const twoTiers = broadside

describe("incursion progress drafts", () => {
  it("round-trips saved progress and drops zero counts from the payload", () => {
    const saved = {
      progress: [{ mowId: "tauBroadside", tiersCleared: 3 }],
      revision: 7,
    }
    const draft = { ...toIncursionProgressDraft(saved), necroReanimator: 0 }
    expect(draft).toEqual({ tauBroadside: 3, necroReanimator: 0 })
    expect(toIncursionProgressPayload(draft, saved)).toEqual(saved)
  })

  it("treats a missing MoW as zero when comparing", () => {
    expect(sameIncursionProgress({ a: 0 }, {})).toBe(true)
    expect(sameIncursionProgress({ a: 1 }, {})).toBe(false)
  })
})

describe("remainingShards", () => {
  it("sums the best path of every uncleared tier", () => {
    expect(remainingShards(twoTiers, 0)).toEqual({
      shards: 50,
      mythicShards: 6,
    })
    expect(remainingShards(twoTiers, 1)).toEqual({
      shards: 18,
      mythicShards: 6,
    })
    expect(remainingShards(twoTiers, 2)).toEqual({
      shards: 0,
      mythicShards: 0,
    })
  })
})

describe("nextTierIndex", () => {
  it("opens the next tier, or the last once all are cleared", () => {
    expect(nextTierIndex(twoTiers, 0)).toBe(0)
    expect(nextTierIndex(twoTiers, 1)).toBe(12)
    expect(nextTierIndex(twoTiers, 2)).toBe(12)
  })
})
