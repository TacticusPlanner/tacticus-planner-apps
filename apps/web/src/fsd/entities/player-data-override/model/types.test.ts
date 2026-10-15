import { describe, expect, it } from "vitest"

import { progressForAlliance, type OnslaughtProgress } from "./types"

const progress: OnslaughtProgress = {
  imperial: { sector: "Gold", tier: 2, isSet: true },
  xenos: { sector: "Stone", tier: 1, isSet: false },
  chaos: { sector: "Stone", tier: 1, isSet: true },
  revision: 1,
}

describe("progressForAlliance", () => {
  it("returns the saved position case-insensitively", () => {
    expect(progressForAlliance(progress, "Imperial")).toEqual(progress.imperial)
  })

  it("treats a saved Stone 1 as real progress", () => {
    expect(progressForAlliance(progress, "Chaos")).toEqual(progress.chaos)
  })

  it("returns undefined for an alliance that was never saved", () => {
    expect(progressForAlliance(progress, "Xenos")).toBeUndefined()
  })
})
