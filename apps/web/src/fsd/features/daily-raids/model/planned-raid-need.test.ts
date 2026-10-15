import { describe, expect, it } from "vitest"

import { plannedRaidNeed } from "./planned-raid-need"

const entry = (
  overrides: Partial<Parameters<typeof plannedRaidNeed>[0]> = {}
): Parameters<typeof plannedRaidNeed>[0] => ({
  resourceId: "upgrade-1",
  raidsPerformed: 2,
  dailyAttempts: 5,
  remainingBefore: 3,
  ...overrides,
})

describe("plannedRaidNeed", () => {
  it("names the upgrades still needed when the node is planned below its cap", () => {
    expect(plannedRaidNeed(entry())).toEqual({ count: 3, unit: "upgrades" })
  })

  it("is empty when the planned raids reach the node's daily cap", () => {
    expect(plannedRaidNeed(entry({ raidsPerformed: 5 }))).toBeUndefined()
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
      plannedRaidNeed(entry({ dailyAttempts: 0, raidsPerformed: 40 }))
    ).toEqual({ count: 3, unit: "upgrades" })
  })
})
