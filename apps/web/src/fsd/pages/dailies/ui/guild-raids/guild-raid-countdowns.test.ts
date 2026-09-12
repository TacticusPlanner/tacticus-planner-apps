import { describe, expect, it } from "vitest"

import { resourceCountdown, seasonEndCountdown } from "./guild-raid-countdowns"

const NOW = new Date("2026-07-12T12:00:00.000Z").getTime()

describe("seasonEndCountdown", () => {
  it("is unavailable when endsAt is null", () => {
    expect(seasonEndCountdown(null, NOW)).toEqual({ kind: "unavailable" })
  })

  it("is pending with the target instant when endsAt is in the future", () => {
    const endsAt = new Date(NOW + 3_600_000).toISOString()
    expect(seasonEndCountdown(endsAt, NOW)).toEqual({
      kind: "pending",
      targetMs: NOW + 3_600_000,
    })
  })

  it("is due once endsAt has passed", () => {
    const endsAt = new Date(NOW - 1000).toISOString()
    expect(seasonEndCountdown(endsAt, NOW)).toEqual({ kind: "due" })
  })
})

describe("resourceCountdown", () => {
  it("is unavailable when the bucket is missing", () => {
    expect(resourceCountdown(undefined, NOW, NOW)).toEqual({
      kind: "unavailable",
    })
    expect(resourceCountdown(null, NOW, NOW)).toEqual({ kind: "unavailable" })
  })

  it("is full when current already meets max, ignoring nextTokenInSeconds", () => {
    expect(
      resourceCountdown(
        { current: 5, max: 5, nextTokenInSeconds: 120 },
        NOW,
        NOW
      )
    ).toEqual({ kind: "full" })
  })

  it("is pending with a target anchored to the snapshot observation time", () => {
    const observedAtMs = NOW - 30_000
    const result = resourceCountdown(
      { current: 2, max: 5, nextTokenInSeconds: 90 },
      observedAtMs,
      NOW
    )
    expect(result).toEqual({ kind: "pending", targetMs: observedAtMs + 90_000 })
  })

  it("is due once the anchored target has passed", () => {
    const observedAtMs = NOW - 120_000
    const result = resourceCountdown(
      { current: 2, max: 5, nextTokenInSeconds: 90 },
      observedAtMs,
      NOW
    )
    expect(result).toEqual({ kind: "due" })
  })

  it("stays due for a long-stale snapshot instead of inventing extra regenerated tokens", () => {
    const observedAtMs = NOW - 10 * 3_600_000
    const result = resourceCountdown(
      { current: 0, max: 5, nextTokenInSeconds: 1800 },
      observedAtMs,
      NOW
    )
    expect(result).toEqual({ kind: "due" })
  })

  it("is unavailable when the source's countdown value is unusable", () => {
    expect(
      resourceCountdown(
        { current: 1, max: 5, nextTokenInSeconds: -1 },
        NOW,
        NOW
      )
    ).toEqual({ kind: "unavailable" })
  })
})
