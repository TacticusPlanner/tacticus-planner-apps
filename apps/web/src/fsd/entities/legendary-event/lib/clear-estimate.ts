import type { LegendaryEventRosterUnit } from "../model/types"
import {
  effectiveHordeMultiplier,
  type HordeModeTierList,
} from "./horde-tier-list"
import { unitCombatPower } from "./unit-combat-power"

/**
 * Effective power ≥ this × a battle's catalog power clears it. A web constant, not catalog data:
 * re-derive it with `calibratePowerRatio` from observed clears and ship the change as a release.
 */
export const CLEAR_ESTIMATE_POWER_RATIO = 1

/** False until `CLEAR_ESTIMATE_POWER_RATIO` is calibrated from observed clears ("uncalibrated"). */
export const CLEAR_ESTIMATE_CALIBRATED = false

/** The power ratio and the catalog `horde-mode-tiers` list in the shape the calculation reads. */
export interface ClearEstimateConfig {
  /** A battle is cleared when effective power ≥ `powerRatio` × its catalog power. */
  powerRatio: number
  /** False while the power ratio is uncalibrated. */
  calibrated: boolean
  /** Each tiered character's horde-mode multiplier; an untiered character has 1.0. */
  hordeMultipliers: ReadonlyMap<string, number>
}

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
 * The config from the power-ratio constants and the catalog `horde-mode-tiers` list (null when that
 * dataset is absent: every character is then untiered). A character's own `multiplier` overrides its
 * tier's.
 */
export function clearEstimateConfig(
  hordeModeTiers: HordeModeTierList | null
): ClearEstimateConfig {
  return {
    powerRatio: CLEAR_ESTIMATE_POWER_RATIO,
    calibrated: CLEAR_ESTIMATE_CALIBRATED,
    hordeMultipliers: new Map(
      (hordeModeTiers?.characters ?? []).flatMap(({ unitId }) => {
        const effective = effectiveHordeMultiplier(hordeModeTiers, unitId)
        return effective === null ? [] : [[unitId, effective] as const]
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

/** Combat power × the unit's horde-mode multiplier; 0 when the roster does not hold it. */
export function unitEffectivePower(
  unitId: string,
  roster: ClearEstimateRoster,
  config: Pick<ClearEstimateConfig, "hordeMultipliers">
): number {
  const power = unitCombatPower(roster.get(unitId))
  return power === 0 ? 0 : power * unitHordeMultiplier(config, unitId)
}

/** The sum of the non-reserve members' effective power (a locked member adds 0). */
export function teamEffectivePower(
  memberUnitIds: readonly string[],
  roster: ClearEstimateRoster,
  config: Pick<ClearEstimateConfig, "hordeMultipliers">
): number {
  return memberUnitIds.reduce(
    (sum, unitId) => sum + unitEffectivePower(unitId, roster, config),
    0
  )
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

/** A team's estimate on a lane; null when no member is owned (nothing to estimate from). */
export function teamClearEstimate(
  memberUnitIds: readonly string[],
  battlePowers: readonly number[],
  roster: ClearEstimateRoster,
  config: ClearEstimateConfig
): ClearEstimate | null {
  if (lockedMemberCount(memberUnitIds, roster) === memberUnitIds.length) {
    return null
  }
  return estimateClearDepth(
    teamEffectivePower(memberUnitIds, roster, config),
    battlePowers,
    config
  )
}

/** A team of five like this unit; null when the roster does not hold it. */
export function unitClearEstimate(
  unitId: string,
  battlePowers: readonly number[],
  roster: ClearEstimateRoster,
  config: ClearEstimateConfig
): ClearEstimate | null {
  if (!roster.has(unitId)) return null
  return estimateClearDepth(
    5 * unitEffectivePower(unitId, roster, config),
    battlePowers,
    config
  )
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
