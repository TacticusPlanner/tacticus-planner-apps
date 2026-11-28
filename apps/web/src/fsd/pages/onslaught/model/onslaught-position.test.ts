import { describe, expect, it } from "vitest"

import { formatReward } from "./onslaught-position"

describe("formatReward", () => {
  it("shows a fixed amount once and a range with a dash", () => {
    expect(formatReward({ min: 3, max: 3, mythic: false })).toBe("3")
    expect(formatReward({ min: 15, max: 17, mythic: false })).toBe("15-17")
  })

  it("marks mythic shards", () => {
    expect(formatReward({ min: 1, max: 1, mythic: true })).toBe("1M")
  })
})
