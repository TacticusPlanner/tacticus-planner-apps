import {
  rosterCharacterPower,
  type UnitPowerContext,
} from "@/shared/unit-power"

import type { LegendaryEventRosterUnit } from "../model/types"
import {
  effectiveHordeMultiplier,
  hordeRelics,
  hordeTierName,
  type HordeModeTierList,
} from "./horde-tier-list"

/**
 * The clear curve, fitted to reported clears (Fabius Bile, Nov 2026: reports #2, #5, #6, #8 and
 * #9 land on their headline depth; see the PR). A team clears a battle of catalog power P when its
 * power reaches r × (P / reference)^exponent × P: early battles need less than their power, late
 * ones more. The likely ratio is the fit; the sure and stretch ratios sit about one late-battle
 * step either side of it (×1.8 and ÷1.7), so most teams read one battle of margin each way and
 * every report bar the unbalanced #4 lands inside its band. The estimate applies it to effective power (horde-mode multipliers included),
 * though the fit used raw power. Web constants, not catalog data: refit them from new reports and ship a release.
 */
export const CLEAR_ESTIMATE_CURVE = {
  /** The battle power at which the requirement is exactly r × P. */
  referencePower: 100_000,
  /** How fast the requirement outgrows battle power (0 is the linear rule). */
  exponent: 0.25,
  /** About one battle step above the fit: a battle within it clears for sure. */
  sureRatio: 2.2,
  /** The fit: the estimate's headline depth. */
  likelyRatio: 1.21,
  /** About one battle step below the fit: a battle past it is out of reach. */
  stretchRatio: 0.7,
} as const

/** Names the curve above in analytics, so results logged under different curves are not mixed.
 *  Bump it whenever a ratio or the exponent changes. */
export const CLEAR_ESTIMATE_CURVE_VERSION = "2026-11-09-e0.25"

/** True once the curve is fitted to observed clears. */
export const CLEAR_ESTIMATE_CALIBRATED = true

/** The clear curve, the catalog `horde-mode-tiers` list and the unit power formula's inputs in the
 *  shape the calculation reads. */
export interface ClearEstimateConfig {
  /** The headline ratio r: a battle of power P clears when power ≥ r × P (× (P / reference)^exponent
   *  with a `curve`). */
  powerRatio: number
  /** The clear curve and its sure / stretch ratios; absent in hand-built configs, which then use the
   *  plain linear rule and one depth for all three bands. */
  curve?: {
    referencePower: number
    exponent: number
    sureRatio: number
    stretchRatio: number
  }
  /** False while the curve is uncalibrated. */
  calibrated: boolean
  /** Each tiered character's horde-mode multiplier; an untiered character has 1.0. */
  hordeMultipliers: ReadonlyMap<string, number>
  /** Each character's relic multipliers by relic id, used in place of its base multiplier while
   *  the roster has that relic equipped; absent in hand-built configs (no relic ratings). */
  hordeRelicMultipliers?: ReadonlyMap<string, ReadonlyMap<string, number>>
  /** Each tiered character's tier name (S, A…), for display; absent in hand-built configs. */
  hordeTiers?: ReadonlyMap<string, string>
  /** The power formula's game data; null when the `unit-power` dataset is absent (no estimate). */
  unitPower: UnitPowerContext | null
}

/** The config fields a power figure reads. */
type PowerConfig = Pick<
  ClearEstimateConfig,
  "hordeMultipliers" | "hordeRelicMultipliers" | "unitPower"
>

/** How far a team (or a single unit) is estimated to clear on a lane (design D3). */
export interface ClearEstimate {
  /** Consecutive battles from battle 1 the power reaches at the headline ratio; 0 when battle 1
   *  fails. */
  depth: number
  /** The depth at the most demanding ratio: battles 1..sureDepth clear for sure (≤ depth). */
  sureDepth: number
  /** The depth at the most lenient ratio: battles past it are out of reach (≥ depth). */
  stretchDepth: number
  battleCount: number
  /** The power the estimate read: effective power for a team (horde-mode multipliers included). */
  power: number
  /** How far above battle `depth`'s threshold, in whole percent; null when `depth` is 0. */
  marginAbovePct: number | null
  /** How far short of battle `depth + 1`'s threshold, in whole percent; null at the last battle. */
  shortfallToNextPct: number | null
  calibrated: boolean
}

/** The roster by unit id, as the estimate reads it. */
export type ClearEstimateRoster = ReadonlyMap<string, LegendaryEventRosterUnit>

/**
 * The config from the clear-curve constants, the catalog `horde-mode-tiers` list (null when that
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
    powerRatio: CLEAR_ESTIMATE_CURVE.likelyRatio,
    curve: {
      referencePower: CLEAR_ESTIMATE_CURVE.referencePower,
      exponent: CLEAR_ESTIMATE_CURVE.exponent,
      sureRatio: CLEAR_ESTIMATE_CURVE.sureRatio,
      stretchRatio: CLEAR_ESTIMATE_CURVE.stretchRatio,
    },
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
    hordeRelicMultipliers: new Map(
      (hordeModeTiers?.characters ?? []).flatMap(({ unitId }) => {
        const relics = hordeRelics(hordeModeTiers, unitId)
        return relics.length === 0
          ? []
          : [
              [
                unitId,
                new Map(
                  relics.map((relic) => [relic.equipmentId, relic.multiplier])
                ),
              ] as const,
            ]
      })
    ),
  }
}

/** A unit's horde-mode multiplier: the highest relic multiplier among the relics `rosterUnit` has
 *  equipped (any level), else its base multiplier, 1.0 when it is untiered. */
export function unitHordeMultiplier(
  config: Pick<
    ClearEstimateConfig,
    "hordeMultipliers" | "hordeRelicMultipliers"
  >,
  unitId: string,
  rosterUnit?: { equippedItems?: readonly { equipmentId: string }[] }
): number {
  const base = config.hordeMultipliers.get(unitId) ?? 1
  const relics = config.hordeRelicMultipliers?.get(unitId)
  if (!relics || !rosterUnit?.equippedItems) return base
  const equipped = rosterUnit.equippedItems.flatMap(({ equipmentId }) => {
    const multiplier = relics.get(equipmentId)
    return multiplier === undefined ? [] : [multiplier]
  })
  return equipped.length === 0 ? base : Math.max(...equipped)
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
  return power === 0
    ? 0
    : power * unitHordeMultiplier(config, unitId, roster.get(unitId))
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

/** The power a battle of catalog power `battlePower` needs at ratio `ratio`: r × P, times
 *  (P / reference)^exponent on the curve. */
export function requiredClearPower(
  battlePower: number,
  ratio: number,
  curve: ClearEstimateConfig["curve"]
): number {
  return curve
    ? ratio *
        (battlePower / curve.referencePower) ** curve.exponent *
        battlePower
    : ratio * battlePower
}

/** Consecutive battles from battle 1 whose requirement at `ratio` the power reaches. */
function depthAt(
  power: number,
  battlePowers: readonly number[],
  ratio: number,
  curve: ClearEstimateConfig["curve"]
): number {
  let depth = 0
  while (
    depth < battlePowers.length &&
    power >= requiredClearPower(battlePowers[depth]!, ratio, curve)
  ) {
    depth++
  }
  return depth
}

/**
 * The largest n such that the power reaches the requirement of every battle 1..n (battles are
 * played in order) at the headline ratio, with the margin above battle n and the shortfall to
 * battle n + 1 as whole percents, and the sure and stretch depths at the curve's other ratios.
 */
export function estimateClearDepth(
  power: number,
  battlePowers: readonly number[],
  config: Pick<ClearEstimateConfig, "powerRatio" | "curve" | "calibrated">
): ClearEstimate {
  const { curve } = config
  const threshold = (index: number) =>
    requiredClearPower(battlePowers[index]!, config.powerRatio, curve)
  const depth = depthAt(power, battlePowers, config.powerRatio, curve)
  return {
    depth,
    sureDepth: curve
      ? Math.min(depth, depthAt(power, battlePowers, curve.sureRatio, curve))
      : depth,
    stretchDepth: curve
      ? Math.max(depth, depthAt(power, battlePowers, curve.stretchRatio, curve))
      : depth,
    battleCount: battlePowers.length,
    power,
    marginAbovePct:
      depth > 0 ? Math.round((power / threshold(depth - 1) - 1) * 100) : null,
    shortfallToNextPct:
      depth < battlePowers.length
        ? Math.round((1 - power / threshold(depth)) * 100)
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
