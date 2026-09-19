import { describe, expect, it } from "vitest"

import { formatGoalRemainingText } from "./goal-remaining-text"

const t = (key: string, opts?: Record<string, unknown>) =>
  opts ? `${key}:${JSON.stringify(opts)}` : key

describe("formatGoalRemainingText", () => {
  it("formats a Level goal as remaining levels only, when no remainingXp is known", () => {
    const text = formatGoalRemainingText(
      t as never,
      "en",
      {
        kind: "Level",
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

  it("formats a Level goal with remaining levels and thousands-separated xp", () => {
    const text = formatGoalRemainingText(
      t as never,
      "en",
      {
        kind: "Level",
        current: 44,
        target: 50,
        ratio: 0.5,
        remainingXp: 12674,
      } as never,
      null,
      undefined
    )
    expect(text).toContain("goals.overview.remainingText.levelsWithXp:")
    expect(text).toContain('"count":"6"')
    expect(text).toContain('"xp":"12,674"')
  })

  it("formats a Rank goal with slots only when no energy estimate is available", () => {
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
    expect(text).toContain("goals.overview.remainingText.rank:")
    expect(text).toContain('"slots":"9"')
  })

  it("formats a Rank goal with slots and thousands-separated energy when an estimate is available", () => {
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
    expect(text).toContain("goals.overview.remainingText.rankWithEnergy:")
    expect(text).toContain('"energy":"1,674"')
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

  it("returns null for a fully-attained Level goal", () => {
    expect(
      formatGoalRemainingText(
        t as never,
        "en",
        { kind: "Level", current: 50, target: 50, ratio: 1 } as never,
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
})
