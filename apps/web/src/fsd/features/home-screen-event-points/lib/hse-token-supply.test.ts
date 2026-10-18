import { describe, expect, it } from "vitest"

import { hseBucketTokens, hseTokenSupply } from "./hse-token-supply"

const HOUR_S = 3600
const bucket = (
  current: number,
  max: number,
  nextHours: number,
  regenHours: number
) => ({
  current,
  max,
  nextTokenInSeconds: nextHours * HOUR_S,
  regenDelayInSeconds: regenHours * HOUR_S,
})

// Psyker Boost 2026-10-19T08:00Z to 2026-10-23T08:00Z (96 hours). Bucket values are the spec's
// illustrative examples, not game constants.
const start = Date.parse("2026-10-19T08:00:00Z")
const end = Date.parse("2026-10-23T08:00:00Z")

describe("hseTokenSupply", () => {
  it("upcoming: a full bucket plus one token per regeneration over the 96 hours", () => {
    const supply = hseTokenSupply(
      {
        Arena: bucket(3, 10, 1, 2),
        Onslaught: bucket(0, 3, 5, 8),
        SalvageRun: bucket(1, 2, 3, 8),
      },
      { status: "upcoming", startMs: start, endMs: end }
    )
    // 10 + floor(96 / 2), 3 + floor(96 / 8), 2 + floor(96 / 8)
    expect(supply).toEqual({ Arena: 58, Onslaught: 15, SalvageRun: 14 })
  })

  it("running: the bucket, the next token, then one per regeneration until the end", () => {
    const observedAtMs = Date.parse("2026-10-21T08:00:00Z") // 48 hours before the end
    const window = { status: "running" as const, endMs: end, observedAtMs }

    // 4 + 1 + floor(47 / 2) = 4 + 1 + 23
    expect(hseBucketTokens(bucket(4, 10, 1, 2), window)).toBe(28)
    // 1 + 1 + floor(46 / 8) = 1 + 1 + 5
    expect(hseBucketTokens(bucket(1, 3, 2, 8), window)).toBe(7)
    // 2 + 1 + floor(40 / 8) = 2 + 1 + 5
    expect(hseBucketTokens(bucket(2, 2, 8, 8), window)).toBe(8)
  })

  it("running: no next token when it lands after the end", () => {
    const observedAtMs = end - 2 * 3_600_000
    expect(
      hseBucketTokens(bucket(2, 3, 5, 8), {
        status: "running",
        endMs: end,
        observedAtMs,
      })
    ).toBe(2)
  })

  it("leaves a mode that is not unlocked as null", () => {
    const supply = hseTokenSupply(
      { Arena: bucket(4, 10, 1, 2), Onslaught: null, SalvageRun: null },
      { status: "upcoming", startMs: start, endMs: end }
    )
    expect(supply).toEqual({ Arena: 58, Onslaught: null, SalvageRun: null })
  })
})
