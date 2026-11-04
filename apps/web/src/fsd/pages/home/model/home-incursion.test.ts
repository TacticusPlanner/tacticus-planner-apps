import { describe, expect, it } from "vitest"

import { homeIncursion } from "./home-incursion"

const NOW = Date.parse("2026-10-03T12:00:00Z")

describe("homeIncursion", () => {
  it("features the newest MoW out", () => {
    expect(
      homeIncursion(
        [
          { mowId: "tauBroadside", availableFromUtc: "2024-12-02T08:00:00Z" },
          {
            mowId: "necroReanimator",
            availableFromUtc: "2026-06-15T08:00:00Z",
          },
        ],
        NOW
      )
    ).toEqual({ mowId: "necroReanimator", arrivesMs: null })
  })

  it("features a MoW still to arrive, with its arrival", () => {
    expect(
      homeIncursion(
        [
          { mowId: "tauBroadside", availableFromUtc: "2024-12-02T08:00:00Z" },
          {
            mowId: "thousDaemonPrince",
            availableFromUtc: "2026-10-20T08:00:00Z",
          },
        ],
        NOW
      )
    ).toEqual({
      mowId: "thousDaemonPrince",
      arrivesMs: Date.parse("2026-10-20T08:00:00Z"),
    })
  })

  it("has nothing to feature without Incursions", () => {
    expect(homeIncursion([], NOW)).toBeNull()
  })
})
