import { describe, expect, it } from "vitest"

import { formatGoalRemainingText } from "./goal-remaining-text"

const t = (key: string, opts?: Record<string, unknown>) =>
  opts ? `${key}:${JSON.stringify(opts)}` : key

describe("formatGoalRemainingText", () => {
  it("formats a level requirement as remaining levels only, when no remainingXp is known", () => {
    const text = formatGoalRemainingText(
      t as never,
      "en",
      {
        kind: "LevelRequirement",
        current: 44,
        target: 50,
        ratio: 0.5,
        remainingXp: null,
      } as never,
      null,
      undefined
    )
    expect(text).toContain("goals.overview.remainingText.levels:")
    expect(text).toContain('"count":"6"')
  })

  it("formats a level requirement with remaining levels and thousands-separated xp", () => {
    const text = formatGoalRemainingText(
      t as never,
      "en",
      {
        kind: "LevelRequirement",
        current: 44,
        target: 50,
        ratio: 0.5,
        remainingXp: 12674,
      } as never,
      null,
      undefined
    )
    expect(text).toContain("goals.overview.remainingText.levels:")
    expect(text).toContain('"count":"6"')
    expect(text).not.toContain("xp")
  })

  it("shows no text for a Rank goal without an energy estimate, never a slot count", () => {
    const text = formatGoalRemainingText(
      t as never,
      "en",
      {
        kind: "Rank",
        current: "Stone1",
        target: "Iron1",
        ratio: 0.25,
      } as never,
      {
        upgrades: [],
        shardId: null,
        shards: 0,
        mythicShards: 0,
        orbsByType: {},
        upgradeSlotsRemaining: 9,
      },
      undefined
    )
    expect(text).toBeNull()
  })

  it("formats a Rank goal as thousands-separated energy only, without slots", () => {
    const text = formatGoalRemainingText(
      t as never,
      "en",
      {
        kind: "Rank",
        current: "Stone1",
        target: "Iron1",
        ratio: 0.25,
      } as never,
      {
        upgrades: [],
        shardId: null,
        shards: 0,
        mythicShards: 0,
        orbsByType: {},
        upgradeSlotsRemaining: 9,
      },
      1674
    )
    expect(text).toContain("goals.overview.remainingText.rankEnergy:")
    expect(text).toContain('"energy":"1,674"')
    expect(text).not.toContain("slots")
  })

  it("formats an Unlock goal as remaining shards", () => {
    const text = formatGoalRemainingText(
      t as never,
      "en",
      { kind: "Unlock", owned: 273, required: 500, ratio: 0.546 } as never,
      {
        upgrades: [],
        shardId: null,
        shards: 227,
        mythicShards: 0,
        orbsByType: {},
        upgradeSlotsRemaining: null,
      },
      undefined
    )
    expect(text).toContain('"count":"227"')
  })

  it("returns null for a fully-attained level requirement", () => {
    expect(
      formatGoalRemainingText(
        t as never,
        "en",
        {
          kind: "LevelRequirement",
          current: 50,
          target: 50,
          ratio: 1,
        } as never,
        null,
        undefined
      )
    ).toBeNull()
  })

  it("falls back to the generic material/energy breakdown for an Ascension goal", () => {
    const text = formatGoalRemainingText(
      t as never,
      "en",
      {
        kind: "Ascension",
        current: "Common:None",
        target: "Common:OneStar",
        ratio: 0.5,
      } as never,
      {
        upgrades: [],
        shardId: null,
        shards: 40,
        mythicShards: 0,
        orbsByType: {},
        upgradeSlotsRemaining: null,
      },
      100
    )
    expect(text).toContain("goals.overview.remaining.shards")
    expect(text).toContain("goals.overview.remaining.energy")
  })

  it("says a Rank goal is covered instead of listing slots an earlier goal already claims", () => {
    const text = formatGoalRemainingText(
      t as never,
      "en",
      { kind: "Rank" } as never,
      {
        upgrades: [],
        shardId: null,
        shards: 0,
        mythicShards: 0,
        orbsByType: {},
        upgradeSlotsRemaining: 0,
        coveredByEarlierGoal: true,
      },
      0
    )
    expect(text).toBe("goals.overview.remainingText.coveredByEarlierGoal")
  })
})
