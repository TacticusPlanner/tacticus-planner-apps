import {
  rosterCharacterPower,
  type UnitPowerContext,
} from "@/shared/unit-power"

import type { LegendaryEventRosterUnit } from "../model/types"
import {
  effectiveHordeMultiplier,
  hordeTierName,
  type HordeModeTierList,
} from "./horde-tier-list"

/**
 * Effective power ≥ this × a battle's catalog power clears it. A web constant, not catalog data:
 * re-derive it with `calibratePowerRatio` from observed clears and ship the change as a release.
 */
export const CLEAR_ESTIMATE_POWER_RATIO = 1

/** False until `CLEAR_ESTIMATE_POWER_RATIO` is calibrated from observed clears ("uncalibrated"). */
export const CLEAR_ESTIMATE_CALIBRATED = false

/** The power ratio, the catalog `horde-mode-tiers` list and the unit power formula's inputs in the
 *  shape the calculation reads. */
export interface ClearEstimateConfig {
  /** A battle is cleared when effective power ≥ `powerRatio` × its catalog power. */
  powerRatio: number
  /** False while the power ratio is uncalibrated. */
  calibrated: boolean
  /** Each tiered character's horde-mode multiplier; an untiered character has 1.0. */
  hordeMultipliers: ReadonlyMap<string, number>
  /** Each tiered character's tier name (S, A…), for display; absent in hand-built configs. */
  hordeTiers?: ReadonlyMap<string, string>
  /** The power formula's game data; null when the `unit-power` dataset is absent (no estimate). */
  unitPower: UnitPowerContext | null
}

/** The config fields a power figure reads. */
type PowerConfig = Pick<ClearEstimateConfig, "hordeMultipliers" | "unitPower">

/** How far a team (or a single unit) is estimated to clear on a lane (design D3). */
export interface ClearEstimate {
  /** Consecutive battles from battle 1 the effective power reaches; 0 when battle 1 fails. */
  depth: number
  battleCount: number
  /** How far above battle `depth`'s threshold, in whole percent; null when `depth` is 0. */
  marginAbovePct: number | null
  /** How far short of battle `depth + 1`'s threshold, in whole percent; null at the last battle. */
  shortfallToNextPct: number | null
  calibrated: boolean
}

/** The roster by unit id, as the estimate reads it. */
export type ClearEstimateRoster = ReadonlyMap<string, LegendaryEventRosterUnit>

/**
 * The config from the power-ratio constants, the catalog `horde-mode-tiers` list (null when that
 * dataset is absent: every character is then untiered) and the power context (null when the
 * `unit-power` dataset is absent: nothing is estimated). A character's own `multiplier` overrides
 * its tier's.
 */
export function clearEstimateConfig(
  hordeModeTiers: HordeModeTierList | null,
  unitPower: UnitPowerContext | null
): ClearEstimateConfig {
  return {
    unitPower,
    powerRatio: CLEAR_ESTIMATE_POWER_RATIO,
    calibrated: CLEAR_ESTIMATE_CALIBRATED,
    hordeMultipliers: new Map(
      (hordeModeTiers?.characters ?? []).flatMap(({ unitId }) => {
        const effective = effectiveHordeMultiplier(hordeModeTiers, unitId)
        return effective === null ? [] : [[unitId, effective] as const]
      })
    ),
    hordeTiers: new Map(
      (hordeModeTiers?.characters ?? []).flatMap(({ unitId }) => {
        const tier = hordeTierName(hordeModeTiers, unitId)
        return tier === null ? [] : [[unitId, tier] as const]
      })
    ),
  }
}

/** A unit's horde-mode multiplier, 1.0 when it is untiered. */
export function unitHordeMultiplier(
  config: Pick<ClearEstimateConfig, "hordeMultipliers">,
  unitId: string
): number {
  return config.hordeMultipliers.get(unitId) ?? 1
}

/** A synced unit's in-game power, items included: 0 when the roster does not hold it, null when
 *  its power data is unavailable (no `unit-power` dataset, or a unit or item it does not know). */
export function unitPower(
  unitId: string,
  roster: ClearEstimateRoster,
  context: UnitPowerContext | null
): number | null {
  return context ? rosterCharacterPower(roster.get(unitId), context) : null
}

/** The sum of the members' power without horde-mode multipliers (a locked member adds 0); null
 *  when any member's power is unavailable, never a partial sum. */
export function teamPower(
  memberUnitIds: readonly string[],
  roster: ClearEstimateRoster,
  context: UnitPowerContext | null
): number | null {
  return sumUnlessUnavailable(memberUnitIds, (unitId) =>
    unitPower(unitId, roster, context)
  )
}

/** Power × the unit's horde-mode multiplier; 0 when the roster does not hold it, null when its
 *  power is unavailable. */
export function unitEffectivePower(
  unitId: string,
  roster: ClearEstimateRoster,
  config: PowerConfig
): number | null {
  const power = unitPower(unitId, roster, config.unitPower)
  if (power === null) return null
  return power === 0 ? 0 : power * unitHordeMultiplier(config, unitId)
}

/** The sum of the non-reserve members' effective power (a locked member adds 0); null when any
 *  member's power is unavailable. */
export function teamEffectivePower(
  memberUnitIds: readonly string[],
  roster: ClearEstimateRoster,
  config: PowerConfig
): number | null {
  return sumUnlessUnavailable(memberUnitIds, (unitId) =>
    unitEffectivePower(unitId, roster, config)
  )
}

function sumUnlessUnavailable(
  unitIds: readonly string[],
  powerOf: (unitId: string) => number | null
): number | null {
  let sum = 0
  for (const unitId of unitIds) {
    const power = powerOf(unitId)
    if (power === null) return null
    sum += power
  }
  return sum
}

/**
 * The largest n such that the effective power reaches `powerRatio` × the power of every battle
 * 1..n (battles are played in order), with the margin above battle n and the shortfall to battle
 * n + 1 as whole percents.
 */
export function estimateClearDepth(
  effectivePower: number,
  battlePowers: readonly number[],
  config: Pick<ClearEstimateConfig, "powerRatio" | "calibrated">
): ClearEstimate {
  const threshold = (index: number) => config.powerRatio * battlePowers[index]!
  let depth = 0
  while (depth < battlePowers.length && effectivePower >= threshold(depth)) {
    depth++
  }
  return {
    depth,
    battleCount: battlePowers.length,
    marginAbovePct:
      depth > 0
        ? Math.round((effectivePower / threshold(depth - 1) - 1) * 100)
        : null,
    shortfallToNextPct:
      depth < battlePowers.length
        ? Math.round((1 - effectivePower / threshold(depth)) * 100)
        : null,
    calibrated: config.calibrated,
  }
}

/** The members the roster does not hold (they add nothing to the estimate). */
export function lockedMemberCount(
  memberUnitIds: readonly string[],
  roster: ClearEstimateRoster
): number {
  return memberUnitIds.filter((unitId) => !roster.has(unitId)).length
}

/** A team's estimate on a lane; null when no member is owned (nothing to estimate from) or any
 *  member's power is unavailable. */
export function teamClearEstimate(
  memberUnitIds: readonly string[],
  battlePowers: readonly number[],
  roster: ClearEstimateRoster,
  config: ClearEstimateConfig
): ClearEstimate | null {
  if (lockedMemberCount(memberUnitIds, roster) === memberUnitIds.length) {
    return null
  }
  const power = teamEffectivePower(memberUnitIds, roster, config)
  return power === null ? null : estimateClearDepth(power, battlePowers, config)
}

/** A team of five like this unit; null when the roster does not hold it or its power is
 *  unavailable. */
export function unitClearEstimate(
  unitId: string,
  battlePowers: readonly number[],
  roster: ClearEstimateRoster,
  config: ClearEstimateConfig
): ClearEstimate | null {
  if (!roster.has(unitId)) return null
  const power = unitEffectivePower(unitId, roster, config)
  return power === null
    ? null
    : estimateClearDepth(5 * power, battlePowers, config)
}

/** The depth to show and plan with (design D2): the run's manual depth, else the estimate. */
export function teamEffectiveDepth(
  manualDepth: number | null,
  estimate: Pick<ClearEstimate, "depth"> | null
): number | null {
  return manualDepth ?? estimate?.depth ?? null
}

/** A lane's battle powers in battle order; null while any of its battles is missing. */
export function laneBattlePowers(
  battleIds: readonly string[],
  battles: readonly { id: string; power: number }[]
): number[] | null {
  const powerById = new Map(battles.map((battle) => [battle.id, battle.power]))
  const powers = battleIds.map((id) => powerById.get(id))
  return powers.every((power) => power !== undefined) ? powers : null
}
