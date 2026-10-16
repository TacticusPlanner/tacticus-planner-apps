import { describe, expect, it } from "vitest"
import type { RaidBreakdownEntry } from "@/features/goal-farming/@x/daily-raids"

import { plannedRaidNeed, plannedRaidNeedForEntry } from "./planned-raid-need"

const entry = (
  overrides: Partial<Parameters<typeof plannedRaidNeed>[0]> = {}
): Parameters<typeof plannedRaidNeed>[0] => ({
  resourceId: "upgrade-1",
  raidsPerformed: 2,
  dailyAttempts: 5,
  remainingBefore: 3,
  dropRate: 1,
  ...overrides,
})

describe("plannedRaidNeed", () => {
  it("names the upgrades still needed when the node is planned below its cap", () => {
    expect(plannedRaidNeed(entry())).toEqual({ count: 3, unit: "upgrades" })
  })

  it("is empty when the planned raids reach the node's daily cap", () => {
    expect(plannedRaidNeed(entry({ raidsPerformed: 5 }))).toBeUndefined()
  })

  it("is empty when a full day of attempts would not drop what is left", () => {
    // Elite node: 10 attempts at ~0.6 drops each can't cover 15 upgrades, so the player raids it out.
    expect(
      plannedRaidNeed(
        entry({
          dailyAttempts: 10,
          raidsPerformed: 4,
          dropRate: 0.6,
          remainingBefore: 15,
        })
      )
    ).toBeUndefined()
  })

  it("names what is left when a full day of attempts exactly covers it", () => {
    expect(
      plannedRaidNeed(
        entry({
          dailyAttempts: 10,
          raidsPerformed: 4,
          dropRate: 0.6,
          remainingBefore: 6,
        })
      )
    ).toEqual({ count: 6, unit: "upgrades" })
  })

  it("rounds a fractional expected need up, ignoring float noise", () => {
    expect(plannedRaidNeed(entry({ remainingBefore: 1.2 }))?.count).toBe(2)
    expect(
      plannedRaidNeed(entry({ remainingBefore: 2.000_000_000_1 }))?.count
    ).toBe(2)
  })

  it("counts shards for shard and mythic-shard resources", () => {
    expect(plannedRaidNeed(entry({ resourceId: "shard:hero" }))?.unit).toBe(
      "shards"
    )
    expect(
      plannedRaidNeed(entry({ resourceId: "mythic-shard:hero" }))?.unit
    ).toBe("shards")
  })

  it("treats a node without a daily cap as never raided out", () => {
    expect(
      plannedRaidNeed(
        entry({ dailyAttempts: 0, raidsPerformed: 40, dropRate: 0.01 })
      )
    ).toEqual({ count: 3, unit: "upgrades" })
  })
})

describe("plannedRaidNeedForEntry", () => {
  it("takes the drop rate from the planned raids", () => {
    const base = {
      resourceId: "upgrade-1" as RaidBreakdownEntry["resourceId"],
      raidsPerformed: 4,
      dailyAttempts: 10,
    }
    expect(
      plannedRaidNeedForEntry({ ...base, itemsFarmed: 2, remainingBefore: 5 })
    ).toEqual({ count: 5, unit: "upgrades" })
    expect(
      plannedRaidNeedForEntry({ ...base, itemsFarmed: 2, remainingBefore: 6 })
    ).toBeUndefined()
  })
})
