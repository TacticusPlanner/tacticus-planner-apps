import { describe, expect, it } from "vitest"

import {
  clearEstimateConfig,
  estimateClearDepth,
  laneBattlePowers,
  lockedMemberCount,
  teamClearEstimate,
  teamEffectiveDepth,
  teamEffectivePower,
  unitClearEstimate,
  unitCoefficient,
  unitEffectivePower,
} from "./clear-estimate"
import {
  UTHAR_ALPHA_POWERS,
  WORKED_CONFIG,
  WORKED_TEAM,
  rosterOf,
} from "./clear-estimate.fixtures"

const roster = rosterOf(WORKED_TEAM)

describe("clear estimate (spec worked examples)", () => {
  it("computes the worked Uthar Alpha team: E 45,718.4, depth 6, 21% above, 32% short", () => {
    expect(unitEffectivePower("ultraCalgar", roster, WORKED_CONFIG)).toBe(8792)
    expect(
      unitEffectivePower("ultraTigurius", roster, WORKED_CONFIG)
    ).toBeCloseTo(10550.4, 6)
    const power = teamEffectivePower(WORKED_TEAM, roster, WORKED_CONFIG)
    expect(power).toBeCloseTo(45718.4, 6)

    const thresholds = UTHAR_ALPHA_POWERS.map(
      (battle) => WORKED_CONFIG.powerRatio * battle
    )
    expect(thresholds).toEqual([
      509, 1527.5, 4099.5, 10351.5, 20293, 37893.5, 67301.5,
    ])

    expect(
      estimateClearDepth(power, UTHAR_ALPHA_POWERS, WORKED_CONFIG)
    ).toEqual({
      depth: 6,
      battleCount: 7,
      marginAbovePct: 21,
      shortfallToNextPct: 32,
      calibrated: true,
    })
  })

  it("sums fewer members for a partial team: E 26,376 clears 5", () => {
    const partial = ["ultraCalgar", "ultraTitus", "ultraApothecary"]
    expect(teamEffectivePower(partial, roster, WORKED_CONFIG)).toBe(26376)
    expect(
      teamClearEstimate(partial, UTHAR_ALPHA_POWERS, roster, WORKED_CONFIG)
        ?.depth
    ).toBe(5)
  })

  it("adds nothing for a locked member: E 36,926.4 clears 5", () => {
    const withoutTitus = rosterOf(
      WORKED_TEAM.filter((unitId) => unitId !== "ultraTitus")
    )
    expect(
      teamEffectivePower(WORKED_TEAM, withoutTitus, WORKED_CONFIG)
    ).toBeCloseTo(36926.4, 6)
    expect(lockedMemberCount(WORKED_TEAM, withoutTitus)).toBe(1)
    expect(
      teamClearEstimate(
        WORKED_TEAM,
        UTHAR_ALPHA_POWERS,
        withoutTitus,
        WORKED_CONFIG
      )?.depth
    ).toBe(5)
  })

  it("estimates a unit as a team of five like it: 52,752 clears 6", () => {
    const estimate = unitClearEstimate(
      "ultraTigurius",
      UTHAR_ALPHA_POWERS,
      roster,
      WORKED_CONFIG
    )
    expect(estimate?.depth).toBe(6)
    expect(
      unitClearEstimate(
        "ultraCalgar",
        UTHAR_ALPHA_POWERS,
        new Map(),
        WORKED_CONFIG
      )
    ).toBeNull()
  })

  it("is depth 0 with no margin above when battle 1 already fails", () => {
    expect(estimateClearDepth(400, UTHAR_ALPHA_POWERS, WORKED_CONFIG)).toEqual({
      depth: 0,
      battleCount: 7,
      marginAbovePct: null,
      shortfallToNextPct: 21,
      calibrated: true,
    })
  })

  it("has no shortfall when the last battle is cleared", () => {
    const estimate = estimateClearDepth(1000, [100, 200], WORKED_CONFIG)
    expect(estimate.depth).toBe(2)
    expect(estimate.marginAbovePct).toBe(900)
    expect(estimate.shortfallToNextPct).toBeNull()
  })

  it("defaults a unit not listed to coefficient 1.0", () => {
    expect(unitCoefficient(WORKED_CONFIG, "ultraCalgar")).toBe(1)
    expect(unitCoefficient(WORKED_CONFIG, "ultraTigurius")).toBe(1.2)
  })

  it("has no team estimate when no member is owned", () => {
    expect(
      teamClearEstimate(
        WORKED_TEAM,
        UTHAR_ALPHA_POWERS,
        new Map(),
        WORKED_CONFIG
      )
    ).toBeNull()
  })

  it("reads the catalog record, uncalibrated while sampleCount is 0", () => {
    const config = clearEstimateConfig({
      powerRatio: 1,
      calibration: { sampleCount: 0 },
      unitCoefficients: [{ unitId: "ultraTigurius", coefficient: 1.2 }],
    })
    expect(config.calibrated).toBe(false)
    expect(config.coefficients.get("ultraTigurius")).toBe(1.2)
    expect(estimateClearDepth(5000, [1000], config).calibrated).toBe(false)
  })

  it("prefers the manual depth over the estimate", () => {
    expect(teamEffectiveDepth(9, { depth: 6 })).toBe(9)
    expect(teamEffectiveDepth(null, { depth: 6 })).toBe(6)
    expect(teamEffectiveDepth(null, null)).toBeNull()
  })

  it("orders a lane's battle powers by its battle ids, null while one is missing", () => {
    const battles = [
      { id: "votanUthar-alpha-2", power: 3055 },
      { id: "votanUthar-alpha-1", power: 1018 },
    ]
    expect(
      laneBattlePowers(["votanUthar-alpha-1", "votanUthar-alpha-2"], battles)
    ).toEqual([1018, 3055])
    expect(
      laneBattlePowers(["votanUthar-alpha-1", "votanUthar-alpha-3"], battles)
    ).toBeNull()
  })
})
