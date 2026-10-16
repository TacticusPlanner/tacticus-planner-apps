import { describe, expect, it } from "vitest"

import {
  calibratePowerRatio,
  calibrationPoint,
  summarizeCalibration,
} from "./calibrate-power-ratio"
import {
  UTHAR_ALPHA_POWERS,
  WORKED_TEAM,
  rosterOf,
  rosterUnit,
} from "./clear-estimate.fixtures"

describe("calibratePowerRatio", () => {
  it("returns the median of the per-sample geometric means (spec two-sample example)", () => {
    const a = calibrationPoint(45718.4, UTHAR_ALPHA_POWERS, 6)!
    const b = calibrationPoint(26376, UTHAR_ALPHA_POWERS, 5)!
    expect(a).toBeCloseTo(0.4527, 4)
    expect(b).toBeCloseTo(0.4756, 4)

    const result = summarizeCalibration([a, b])
    expect(result.powerRatio).toBeCloseTo(0.4641, 4)
    expect(result.sampleCount).toBe(2)
  })

  it("calibrates real samples: the worked team at depth 6 and a partial team at depth 5", () => {
    const roster = rosterOf(WORKED_TEAM)
    const fullTeam = 8792 * 5
    const partial = 8792 * 3
    const result = calibratePowerRatio([
      {
        battlePowers: UTHAR_ALPHA_POWERS,
        memberUnitIds: WORKED_TEAM,
        roster,
        depth: 6,
      },
      {
        battlePowers: UTHAR_ALPHA_POWERS,
        memberUnitIds: ["ultraCalgar", "ultraTitus", "ultraApothecary"],
        roster,
        depth: 5,
      },
    ])
    const pointA = Math.sqrt((fullTeam / 134603) * (fullTeam / 75787))
    const pointB = Math.sqrt((partial / 75787) * (partial / 40586))
    expect(result.sampleCount).toBe(2)
    expect(result.powerRatio).toBeCloseTo((pointA + pointB) / 2, 10)
    expect(result.interquartileRange?.q1).toBeLessThanOrEqual(
      result.interquartileRange!.q3
    )
  })

  it("skips depth 0 and samples with a locked member", () => {
    const roster = rosterOf(["ultraCalgar"])
    const result = calibratePowerRatio([
      {
        battlePowers: UTHAR_ALPHA_POWERS,
        memberUnitIds: ["ultraCalgar"],
        roster,
        depth: 0,
      },
      {
        battlePowers: UTHAR_ALPHA_POWERS,
        memberUnitIds: ["ultraCalgar", "ultraTitus"],
        roster,
        depth: 3,
      },
    ])
    expect(result).toEqual({
      powerRatio: null,
      sampleCount: 0,
      interquartileRange: null,
    })
  })

  it("uses the upper bound alone when the depth is the lane's last battle", () => {
    const roster = new Map([["ultraCalgar", rosterUnit("ultraCalgar")]])
    const result = calibratePowerRatio([
      {
        battlePowers: [1000, 4000],
        memberUnitIds: ["ultraCalgar"],
        roster,
        depth: 2,
      },
    ])
    expect(result.powerRatio).toBeCloseTo(8792 / 4000, 10)
    expect(result.sampleCount).toBe(1)
  })
})
