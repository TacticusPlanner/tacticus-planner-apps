import type { LegendaryEventRosterUnit } from "../model/types"
import { unitCombatPower } from "./unit-combat-power"

/** The curated `legendary-event-clear-estimate` and `horde-mode-tiers` records in the shape the
 *  calculation reads. */
export interface ClearEstimateConfig {
  /** A battle is cleared when effective power ≥ `powerRatio` × its catalog power. */
  powerRatio: number
  /** False while the dataset's `calibration.sampleCount` is 0 ("uncalibrated"). */
  calibrated: boolean
  /** Each tiered character's horde-mode tier multiplier; an untiered character has 1.0. */
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

/** The catalog horde-mode tier list, as the config reads it. */
export interface HordeModeTierList {
  tiers: readonly { tier: string; multiplier: number }[]
  characters: readonly { unitId: string; tier: string }[]
}

/**
 * The config from the catalog `legendary-event-clear-estimate` record and the `horde-mode-tiers`
 * list (null when that dataset is absent: every character is then untiered).
 */
export function clearEstimateConfig(
  estimate: { powerRatio: number; calibration: { sampleCount: number } },
  hordeModeTiers: HordeModeTierList | null
): ClearEstimateConfig {
  const multiplierByTier = new Map(
    (hordeModeTiers?.tiers ?? []).map((entry) => [entry.tier, entry.multiplier])
  )
  return {
    powerRatio: estimate.powerRatio,
    calibrated: estimate.calibration.sampleCount > 0,
    hordeMultipliers: new Map(
      (hordeModeTiers?.characters ?? []).flatMap(({ unitId, tier }) => {
        const multiplier = multiplierByTier.get(tier)
        return multiplier === undefined ? [] : [[unitId, multiplier] as const]
      })
    ),
  }
}

/** A unit's horde-mode tier multiplier, 1.0 when it is untiered. */
export function unitHordeMultiplier(
  config: Pick<ClearEstimateConfig, "hordeMultipliers">,
  unitId: string
): number {
  return config.hordeMultipliers.get(unitId) ?? 1
}

/** Combat power × the unit's horde-mode tier multiplier; 0 when the roster does not hold it. */
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
