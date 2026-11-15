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
    const window = {
      status: "running" as const,
      startMs: start,
      endMs: end,
      observedAtMs,
    }

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
        startMs: start,
        endMs: end,
        observedAtMs,
      })
    ).toBe(2)
  })

  it("running, synced before the start: rolls the bucket forward to the start, capped at max", () => {
    const window = {
      status: "running" as const,
      startMs: start,
      endMs: end,
      observedAtMs: Date.parse("2026-10-16T08:00:00Z"), // 72 hours before the start
    }
    // 4 + 36 arrivals before the start caps at 10; then floor(96 / 2) over the event.
    expect(hseBucketTokens(bucket(4, 10, 1, 2), window)).toBe(58)
    // Not capped at the start: 0 + 1 (at -3 h) + 1 (at +5 h) + floor((96 - 5) / 8) = 13.
    expect(
      hseBucketTokens(bucket(0, 3, 5, 8), {
        ...window,
        observedAtMs: start - 8 * 3_600_000,
      })
    ).toBe(13)
  })

  it("running: a full bucket (nextTokenInSeconds 0) regenerates only after it is spent", () => {
    const window = {
      status: "running" as const,
      startMs: start,
      endMs: end,
      observedAtMs: end - 10 * 3_600_000,
    }
    // 10 + floor(10 / 2): no extra token for the stopped countdown.
    expect(hseBucketTokens(bucket(10, 10, 0, 2), window)).toBe(15)
    // The API can report more than max (15 of 3): every held token counts.
    expect(hseBucketTokens(bucket(15, 3, 0, 8), window)).toBe(16)
  })

  it("leaves a mode that is not unlocked as null", () => {
    const supply = hseTokenSupply(
      { Arena: bucket(4, 10, 1, 2), Onslaught: null, SalvageRun: null },
      { status: "upcoming", startMs: start, endMs: end }
    )
    expect(supply).toEqual({ Arena: 58, Onslaught: null, SalvageRun: null })
  })
})
