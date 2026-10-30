import { describe, expect, it } from "vitest"

import { resolveGuildRaidLineupFocus } from "./resolve-guild-raid-lineup-focus"

const slot = (
  essential: boolean,
  readiness: number | undefined,
  picked: unknown = "unit"
) => ({ essential, readiness, picked })

describe("resolveGuildRaidLineupFocus", () => {
  it("lists every empty slot and prefers the weakest essential slot", () => {
    expect(
      resolveGuildRaidLineupFocus([
        slot(true, 90),
        slot(true, 72),
        slot(false, 40),
        slot(false, 0, null),
        slot(false, 0, null),
      ])
    ).toEqual({ emptySlotIndexes: [3, 4], weakestSlotIndex: 1 })
  })

  it("falls back to the weakest other slot when every essential slot is at the target", () => {
    expect(
      resolveGuildRaidLineupFocus([
        slot(true, 100),
        slot(false, 85),
        slot(false, 60),
        slot(false, 60),
      ]).weakestSlotIndex
    ).toBe(2)
  })

  it("has nothing to point at when the lineup is complete and on target", () => {
    expect(
      resolveGuildRaidLineupFocus([slot(true, 100), slot(false, 100)])
    ).toEqual({ emptySlotIndexes: [], weakestSlotIndex: null })
  })

  it("only reports empty slots when percentages are withheld", () => {
    expect(
      resolveGuildRaidLineupFocus([
        slot(true, undefined),
        slot(false, undefined, null),
      ])
    ).toEqual({ emptySlotIndexes: [1], weakestSlotIndex: null })
  })
})
