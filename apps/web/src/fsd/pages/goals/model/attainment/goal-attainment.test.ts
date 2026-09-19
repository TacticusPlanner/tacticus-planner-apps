import { describe, expect, it } from "vitest"

import { isPlayerDataUnavailable, UNKNOWN } from ".//goal-attainment"

const REACHED = { status: "reached" as const, reached: true }

describe("isPlayerDataUnavailable", () => {
  it("does not fire when attainment is already known", () => {
    expect(
      isPlayerDataUnavailable({
        attainment: REACHED,
        rosterLoaded: true,
        playerUnit: undefined,
      })
    ).toBe(false)
  })

  it("does not fire for a loaded roster that simply lacks the unit (2.2)", () => {
    expect(
      isPlayerDataUnavailable({
        attainment: UNKNOWN,
        rosterLoaded: true,
        playerUnit: undefined,
      })
    ).toBe(false)
  })

  it("still fires when the roster itself hasn't loaded (2.3)", () => {
    expect(
      isPlayerDataUnavailable({
        attainment: UNKNOWN,
        rosterLoaded: false,
        playerUnit: undefined,
      })
    ).toBe(true)
  })

  it("fires when unknown for a reason other than roster absence, e.g. the unit is owned", () => {
    expect(
      isPlayerDataUnavailable({
        attainment: UNKNOWN,
        rosterLoaded: true,
        playerUnit: { xpLevel: 10 },
      })
    ).toBe(true)
  })
})
