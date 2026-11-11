import { describe, expect, it } from "vitest"

import { plannedAbilityTracks } from "./planned-ability-tracks"

const goal = (
  activeStart: number,
  activeEnd: number,
  passiveStart: number,
  passiveEnd: number
) =>
  ({
    goalType: "Ability",
    activeStart,
    activeEnd,
    passiveStart,
    passiveEnd,
  }) as const

describe("plannedAbilityTracks", () => {
  it("lists both tracks, Active first", () => {
    expect(plannedAbilityTracks(goal(10, 50, 20, 50))).toEqual([
      { track: "active", start: 10, end: 50 },
      { track: "passive", start: 20, end: 50 },
    ])
  })

  it("leaves out a track already at its target", () => {
    expect(plannedAbilityTracks(goal(50, 50, 26, 50))).toEqual([
      { track: "passive", start: 26, end: 50 },
    ])
  })
})
