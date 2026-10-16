import { describe, expect, it } from "vitest"

import {
  CLEAR_ESTIMATE_CALIBRATED,
  CLEAR_ESTIMATE_POWER_RATIO,
  clearEstimateConfig,
  estimateClearDepth,
  laneBattlePowers,
  lockedMemberCount,
  teamClearEstimate,
  teamEffectiveDepth,
  teamEffectivePower,
  unitClearEstimate,
  unitHordeMultiplier,
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

  it("defaults an untiered unit to multiplier 1.0", () => {
    expect(unitHordeMultiplier(WORKED_CONFIG, "ultraCalgar")).toBe(1)
    expect(unitHordeMultiplier(WORKED_CONFIG, "ultraTigurius")).toBe(1.2)
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

  it("reads the tier list, a character's own multiplier overriding its tier's", () => {
    const config = clearEstimateConfig({
      tiers: [
        { tier: "S", multiplier: 1.85 },
        { tier: "A", multiplier: 1.55 },
      ],
      characters: [
        { unitId: "ultraTigurius", tier: "A" },
        { unitId: "custoBladeChampion", tier: "S", multiplier: 2 },
        { unitId: "ultraCalgar", tier: "D" },
        { unitId: "bloodDante", tier: "D", multiplier: 1.4 },
      ],
    })
    expect(config.powerRatio).toBe(CLEAR_ESTIMATE_POWER_RATIO)
    expect(config.calibrated).toBe(CLEAR_ESTIMATE_CALIBRATED)
    expect(unitHordeMultiplier(config, "ultraTigurius")).toBe(1.55)
    expect(unitHordeMultiplier(config, "custoBladeChampion")).toBe(2)
    // A tier the list does not define leaves the character untiered, unless it has its own value.
    expect(unitHordeMultiplier(config, "ultraCalgar")).toBe(1)
    expect(unitHordeMultiplier(config, "bloodDante")).toBe(1.4)
    expect(estimateClearDepth(5000, [1000], config).calibrated).toBe(
      CLEAR_ESTIMATE_CALIBRATED
    )
  })

  it("treats every unit as untiered without a horde-mode tier list", () => {
    const config = clearEstimateConfig(null)
    expect(config.hordeMultipliers.size).toBe(0)
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
