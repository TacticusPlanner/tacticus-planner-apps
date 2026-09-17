import { describe, expect, it } from "vitest"

import { tokenCountdown } from "./token-countdown"

const NOW = new Date("2026-07-12T12:00:00.000Z").getTime()

describe("tokenCountdown", () => {
  it("is unavailable when the bucket is missing", () => {
    expect(tokenCountdown(undefined, NOW, NOW)).toEqual({
      kind: "unavailable",
    })
    expect(tokenCountdown(null, NOW, NOW)).toEqual({ kind: "unavailable" })
  })

  it("is full when current already meets max", () => {
    expect(
      tokenCountdown({ current: 5, max: 5, nextTokenInSeconds: 1200 }, NOW, NOW)
    ).toEqual({ kind: "full" })
  })

  it("is pending with a target anchored to the snapshot observation time", () => {
    const observedAtMs = NOW - 300_000
    const result = tokenCountdown(
      { current: 3, max: 5, nextTokenInSeconds: 1200 },
      observedAtMs,
      NOW
    )
    expect(result).toEqual({
      kind: "pending",
      targetMs: observedAtMs + 1_200_000,
    })
  })

  it("is due once the anchored target has passed", () => {
    const observedAtMs = NOW - 2_000_000
    const result = tokenCountdown(
      { current: 3, max: 5, nextTokenInSeconds: 1200 },
      observedAtMs,
      NOW
    )
    expect(result).toEqual({ kind: "due" })
  })

  it("is unavailable when nextTokenInSeconds is missing/negative", () => {
    expect(
      tokenCountdown({ current: 1, max: 5, nextTokenInSeconds: -1 }, NOW, NOW)
    ).toEqual({ kind: "unavailable" })
  })
})
