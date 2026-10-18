import type { UnitPowerContext } from "@/shared/unit-power"

import {
  lockedMemberCount,
  teamPower,
  type ClearEstimateRoster,
} from "./clear-estimate"

/** One team with a manual depth on a lane, with the roster its members are read from. */
export interface CalibrationSample {
  /** The lane's battle powers in battle order. */
  battlePowers: readonly number[]
  memberUnitIds: readonly string[]
  roster: ClearEstimateRoster
  /** The manual depth: the team clears battle d and not d + 1. */
  depth: number
}

export interface PowerRatioCalibration {
  /** The median of the samples' point values; null without a usable sample. */
  powerRatio: number | null
  sampleCount: number
  /** The 25th and 75th percentiles of the point values, for the PR note; null without samples. */
  interquartileRange: { q1: number; q3: number } | null
}

/**
 * Fits the power ratio from manual depths (design D4). With every multiplier at 1.0, a team with
 * effective power E that clears battle d and not d + 1 has a ratio in
 * (E ÷ power[d + 1], E ÷ power[d]]; the sample's point value is the geometric mean of the two
 * bounds (the upper bound alone when d is the last battle). Samples with d < 1, a depth past the
 * lane, a locked member or a member without power data are skipped (all of them without the
 * `unit-power` dataset).
 */
export function calibratePowerRatio(
  samples: readonly CalibrationSample[],
  unitPower: UnitPowerContext | null
): PowerRatioCalibration {
  return summarizeCalibration(
    samples.flatMap((sample) => {
      const { battlePowers, depth, memberUnitIds, roster } = sample
      if (memberUnitIds.length === 0) return []
      if (lockedMemberCount(memberUnitIds, roster) > 0) return []
      const power = teamPower(memberUnitIds, roster, unitPower)
      if (power === null) return []
      const point = calibrationPoint(power, battlePowers, depth)
      return point === null ? [] : [point]
    })
  )
}

/** One sample's point value: the geometric mean of E ÷ power[d + 1] and E ÷ power[d], or the
 *  upper bound alone at the lane's last battle; null when d is outside 1..battle count. */
export function calibrationPoint(
  effectivePower: number,
  battlePowers: readonly number[],
  depth: number
): number | null {
  if (depth < 1 || depth > battlePowers.length) return null
  const upper = effectivePower / battlePowers[depth - 1]!
  if (depth === battlePowers.length) return upper
  const lower = effectivePower / battlePowers[depth]!
  return Math.sqrt(lower * upper)
}

/** The median, count and interquartile range of the point values. */
export function summarizeCalibration(
  points: readonly number[]
): PowerRatioCalibration {
  const values = [...points].sort((a, b) => a - b)
  if (values.length === 0) {
    return { powerRatio: null, sampleCount: 0, interquartileRange: null }
  }
  return {
    powerRatio: quantile(values, 0.5),
    sampleCount: values.length,
    interquartileRange: {
      q1: quantile(values, 0.25),
      q3: quantile(values, 0.75),
    },
  }
}

/** Linear-interpolated quantile of an ascending list. */
function quantile(sorted: readonly number[], q: number): number {
  const position = (sorted.length - 1) * q
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  const weight = position - lower
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight
}
