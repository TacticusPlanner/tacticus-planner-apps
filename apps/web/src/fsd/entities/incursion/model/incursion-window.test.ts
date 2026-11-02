import { describe, expect, it } from "vitest"

import { incursionWindow } from "./incursion-window"

const NOW = Date.parse("2026-11-03T12:00:00Z")
const entry = (definitionId: string, startUtc: string, endUtc: string) => ({
  definitionId,
  startUtc,
  endUtc,
})

describe("incursionWindow", () => {
  it("picks the Incursion running now, with its end", () => {
    expect(
      incursionWindow(
        [
          entry(
            "hse-machine-hunt",
            "2026-11-01T08:00:00Z",
            "2026-11-05T08:00:00Z"
          ),
          entry("incursion", "2026-11-02T08:00:00Z", "2026-11-07T08:00:00Z"),
          entry("incursion", "2026-12-07T08:00:00Z", "2026-12-12T08:00:00Z"),
        ],
        NOW
      )
    ).toEqual({
      status: "live",
      startMs: Date.parse("2026-11-02T08:00:00Z"),
      endMs: Date.parse("2026-11-07T08:00:00Z"),
    })
  })

  it("else picks the next Incursion to start", () => {
    expect(
      incursionWindow(
        [
          entry("incursion", "2026-12-07T08:00:00Z", "2026-12-12T08:00:00Z"),
          entry("incursion", "2026-11-20T08:00:00Z", "2026-11-25T08:00:00Z"),
          entry("incursion", "2026-10-01T08:00:00Z", "2026-10-06T08:00:00Z"),
        ],
        NOW
      )
    ).toEqual({
      status: "upcoming",
      startMs: Date.parse("2026-11-20T08:00:00Z"),
      endMs: Date.parse("2026-11-25T08:00:00Z"),
    })
  })

  it("has no window without Incursion entries", () => {
    expect(
      incursionWindow(
        [
          entry(
            "hse-machine-hunt",
            "2026-11-01T08:00:00Z",
            "2026-11-05T08:00:00Z"
          ),
        ],
        NOW
      )
    ).toBeNull()
  })
})
