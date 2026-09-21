import { describe, expect, it } from "vitest"

import { formatExactCountdown } from "./format-exact-countdown"

describe("formatExactCountdown", () => {
  it("formats a sub-hour duration with a zero hours component", () => {
    expect(formatExactCountdown(900_000, 0)).toBe("0:15:00")
  })

  it("keeps hours unbounded past 24 hours", () => {
    expect(formatExactCountdown(98_103_000, 0)).toBe("27:15:03")
  })

  it("formats an exact zero duration", () => {
    expect(formatExactCountdown(0, 0)).toBe("0:00:00")
  })

  it("clamps a past target to zero", () => {
    expect(formatExactCountdown(-1_000, 0)).toBe("0:00:00")
  })
})
