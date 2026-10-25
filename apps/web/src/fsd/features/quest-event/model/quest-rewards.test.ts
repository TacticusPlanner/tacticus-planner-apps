import { describe, expect, it } from "vitest"

import { crateTrack, questShards, shardMeaning } from "./quest-rewards"
import { questTokenPlan } from "./quest-token-plan"

const crates = [
  { number: 2, points: 1800 },
  { number: 1, points: 1000 },
  { number: 3, points: 2500 },
]

describe("crateTrack", () => {
  it("marks opened crates and the next one with the points it needs", () => {
    const track = crateTrack(crates, {
      total: 1200,
      nextCrate: { number: 2, points: 1800 } as never,
    })

    expect(track.map((view) => view.crate.number)).toEqual([1, 2, 3])
    expect(track.map((view) => view.opened)).toEqual([true, false, false])
    expect(track[1]).toMatchObject({ next: true, pointsToGo: 600 })
    expect(track[2]).toMatchObject({ next: false, pointsToGo: 1300 })
  })
})

describe("questShards", () => {
  it("counts a shard per medal, three with the bundle", () => {
    const medals = Array.from({ length: 10 }, () => 3)

    expect(questShards(medals, false)).toEqual({
      earned: 30,
      max: 51,
      reachable: 21,
    })
    expect(questShards(medals, true)).toEqual({
      earned: 90,
      max: 153,
      reachable: 63,
    })
  })
})

describe("shardMeaning", () => {
  const unlockCostByRarity = new Map([["Rare", { shards: 40 }]])
  const ascensionCostByProgression = new Map([
    ["Common:OneStar", { shards: 10, mythicShards: 0 }],
    ["Common:TwoStars", { shards: 15, mythicShards: 0 }],
    ["Uncommon:TwoStars", { shards: 20, mythicShards: 0 }],
    ["Uncommon:ThreeStars", { shards: 30, mythicShards: 0 }],
  ])
  const base = {
    initialRarity: "Rare",
    unlockCostByRarity,
    ascensionCostByProgression,
  }

  it("weighs the unlock cost of a hero not owned against held plus maximum shards", () => {
    expect(
      shardMeaning({
        ...base,
        shards: questShards([3, 3], false),
        owned: null,
        notOwnedShards: 12,
      })
    ).toEqual({ kind: "unlock", cost: 40, spare: 23, reachedSoFar: false })
  })

  it("walks the ascension costs an owned hero's shards cover", () => {
    expect(
      shardMeaning({
        ...base,
        shards: questShards([3, 3], false),
        owned: { progression: "Common:None", shards: 5 },
        notOwnedShards: null,
      })
    ).toEqual({
      kind: "ascend",
      steps: ["Common:OneStar", "Common:TwoStars", "Uncommon:TwoStars"],
      reachedSoFar: 1,
      spare: 11,
    })
  })

  it("is unknown without the cost tables", () => {
    expect(
      shardMeaning({
        shards: questShards([], false),
        owned: null,
        notOwnedShards: 0,
        initialRarity: "Rare",
        unlockCostByRarity: undefined,
        ascensionCostByProgression: undefined,
      })
    ).toEqual({ kind: "unknown" })
  })
})

describe("questTokenPlan", () => {
  const startMs = Date.parse("2026-10-21T00:00:00Z")
  const endMs = Date.parse("2026-10-24T00:00:00Z")

  it("counts tokens held plus the regen to the end, and when the bank fills", () => {
    const plan = questTokenPlan({
      phase: "running",
      startMs,
      endMs,
      nowMs: Date.parse("2026-10-23T14:00:00Z"),
      tokens: { count: 5, atUtc: "2026-10-23T14:00:00Z" },
      battlesToImprove: 4,
    })

    expect(plan).toEqual({
      kind: "running",
      attempts: 10,
      assumedFull: false,
      battlesToImprove: 4,
      spare: 6,
      bankFullMs: Date.parse("2026-10-23T16:00:00Z"),
    })
  })

  it("assumes a full bank without an entry", () => {
    expect(
      questTokenPlan({
        phase: "running",
        startMs,
        endMs,
        nowMs: startMs,
        tokens: null,
        battlesToImprove: 17,
      })
    ).toMatchObject({ attempts: 42, assumedFull: true, bankFullMs: null })
  })

  it("previews the whole quest's attempts and closes in the claim window", () => {
    const params = {
      startMs,
      endMs,
      nowMs: startMs,
      tokens: null,
      battlesToImprove: 0,
    }
    expect(questTokenPlan({ ...params, phase: "preview" })).toEqual({
      kind: "preview",
      attempts: 42,
    })
    expect(questTokenPlan({ ...params, phase: "claim" })).toEqual({
      kind: "closed",
    })
  })
})
