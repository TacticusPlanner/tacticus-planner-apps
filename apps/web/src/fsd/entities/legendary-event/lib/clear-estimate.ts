import {
  npcPowerAtLadder,
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
import {
  npcAdjustedBattlePower,
  npcTierMultipliers,
  type NpcTierListRecord,
  type NpcTieredBattle,
} from "./npc-tier-list"

/**
 * The clear curve, refitted (Nov 2026) to about 2,300 Fabius Bile battle attempts logged by the
 * `legendary_event_token_*` analytics events, together with the catalog `npc-tiers` coefficients
 * and `TEAM_BALANCE`. A team clears a battle of NPC-adjusted power P when its balance-adjusted
 * effective power reaches r × (P / reference)^exponent × P. The exponent is slightly negative:
 * early battles need relatively more than their power says, late ones relatively less (the old
 * +0.25 curve read low battles 1–2 too deep and strong balanced teams 1–3 too shallow). The likely
 * ratio is the fit's 50% point; the sure and stretch ratios keep the bands' width (×1.82 and ÷1.73).
 * Web constants, not catalog data: refit them with the NPC tiers from new results and ship a release.
 */
export const CLEAR_ESTIMATE_CURVE = {
  /** The battle power at which the requirement is exactly r × P. */
  referencePower: 100_000,
  /** How fast the requirement outgrows battle power (0 is the linear rule). */
  exponent: -0.1,
  /** About one battle step above the fit: a battle within it clears for sure. */
  sureRatio: 2.47,
  /** The fit: the estimate's headline depth. */
  likelyRatio: 1.36,
  /** About one battle step below the fit: a battle past it is out of reach. */
  stretchRatio: 0.79,
} as const

/**
 * The team-balance correction, fitted with the curve: a team whose strongest member holds a share s
 * of the members' summed power (horde-mode multipliers excluded) counts its effective power ×
 * exp(−slope × (s − neutralShare)). Lopsided teams read shallower (one carry can't cover the rest),
 * balanced ones deeper: share 0.2 (five equal members) ×1.30, 0.6 ×0.77, 0.9 ×0.52.
 */
const TEAM_BALANCE = {
  /** The top-member share at which the correction is ×1. */
  neutralShare: 0.4,
  slope: 1.3,
} as const

/** Names the curve above in analytics, so results logged under different curves are not mixed.
 *  Bump it whenever a ratio, the exponent, the balance correction or the NPC tiers change. */
export const CLEAR_ESTIMATE_CURVE_VERSION = "2026-11-14-npc-balance"

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
  /** The team-balance correction (`TEAM_BALANCE`); absent in hand-built configs, which then read
   *  effective power as is. */
  teamBalance?: { neutralShare: number; slope: number }
  /** Each tiered character's horde-mode multiplier; an untiered character has 1.0. */
  hordeMultipliers: ReadonlyMap<string, number>
  /** Each character's relic multipliers by relic id, used in place of its base multiplier while
   *  the roster has that relic equipped; absent in hand-built configs (no relic ratings). */
  hordeRelicMultipliers?: ReadonlyMap<string, ReadonlyMap<string, number>>
  /** Each tiered character's tier name (S, A…), for display; absent in hand-built configs. */
  hordeTiers?: ReadonlyMap<string, string>
  /** The power formula's game data; null when the `unit-power` dataset is absent (no estimate). */
  unitPower: UnitPowerContext | null
  /** Each tiered enemy NPC's multiplier on its power (catalog `npc-tiers`); an NPC absent here, or
   *  every NPC when this is absent (hand-built configs), uses 1.0. */
  npcMultipliers?: ReadonlyMap<string, number>
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
  /** The power the estimate read: effective power for a team (horde-mode multipliers included),
   *  before the team-balance correction. */
  power: number
  /** The team-balance factor the power was multiplied by before comparing with the curve (1 without
   *  the correction). */
  balanceFactor: number
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
 * dataset is absent: every character is then untiered), the power context (null when the
 * `unit-power` dataset is absent: nothing is estimated) and the catalog `npc-tiers` list (null when
 * absent: every enemy NPC is untiered). A character's or NPC's own `multiplier` overrides its tier's.
 */
export function clearEstimateConfig(
  hordeModeTiers: HordeModeTierList | null,
  unitPower: UnitPowerContext | null,
  npcTiers: NpcTierListRecord | null = null
): ClearEstimateConfig {
  return {
    unitPower,
    npcMultipliers: npcTierMultipliers(npcTiers),
    powerRatio: CLEAR_ESTIMATE_CURVE.likelyRatio,
    curve: {
      referencePower: CLEAR_ESTIMATE_CURVE.referencePower,
      exponent: CLEAR_ESTIMATE_CURVE.exponent,
      sureRatio: CLEAR_ESTIMATE_CURVE.sureRatio,
      stretchRatio: CLEAR_ESTIMATE_CURVE.stretchRatio,
    },
    teamBalance: TEAM_BALANCE,
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

/** Each member's power without horde-mode multipliers, in member order (a locked member is 0);
 *  null when any member's power is unavailable. */
export function memberPowers(
  memberUnitIds: readonly string[],
  roster: ClearEstimateRoster,
  context: UnitPowerContext | null
): number[] | null {
  const powers: number[] = []
  for (const unitId of memberUnitIds) {
    const power = unitPower(unitId, roster, context)
    if (power === null) return null
    powers.push(power)
  }
  return powers
}

/** The ratio r at which `effectivePower` exactly meets a battle of catalog power `battlePower` on
 *  the shipped curve: above `sureRatio` the battle reads as a safe clear, below `stretchRatio` out of
 *  reach. Analytics compare it with what the team really cleared to refit the ratios. */
export function battlePowerRatio(
  effectivePower: number,
  battlePower: number
): number {
  return (
    effectivePower / requiredClearPower(battlePower, 1, CLEAR_ESTIMATE_CURVE)
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
  // A battle of no power needs none (a negative exponent would otherwise read 0^-x as infinite).
  if (battlePower <= 0) return 0
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
  config: Pick<ClearEstimateConfig, "powerRatio" | "curve" | "calibrated">,
  balanceFactor = 1
): ClearEstimate {
  const { curve } = config
  const adjusted = power * balanceFactor
  const threshold = (index: number) =>
    requiredClearPower(battlePowers[index]!, config.powerRatio, curve)
  const depth = depthAt(adjusted, battlePowers, config.powerRatio, curve)
  return {
    depth,
    sureDepth: curve
      ? Math.min(depth, depthAt(adjusted, battlePowers, curve.sureRatio, curve))
      : depth,
    stretchDepth: curve
      ? Math.max(
          depth,
          depthAt(adjusted, battlePowers, curve.stretchRatio, curve)
        )
      : depth,
    battleCount: battlePowers.length,
    power,
    balanceFactor,
    marginAbovePct:
      depth > 0
        ? Math.round((adjusted / threshold(depth - 1) - 1) * 100)
        : null,
    shortfallToNextPct:
      depth < battlePowers.length
        ? Math.round((1 - adjusted / threshold(depth)) * 100)
        : null,
    calibrated: config.calibrated,
  }
}

/** The strongest member's share of the members' summed power; null when they sum to 0. */
export function topMemberShare(powers: readonly number[]): number | null {
  const total = powers.reduce((sum, power) => sum + power, 0)
  return total > 0 ? Math.max(...powers) / total : null
}

/** The team-balance factor for a top-member share (`TEAM_BALANCE`): 1 without the correction or a
 *  share. */
export function teamBalanceFactor(
  share: number | null,
  balance: ClearEstimateConfig["teamBalance"]
): number {
  return balance && share !== null
    ? Math.exp(-balance.slope * (share - balance.neutralShare))
    : 1
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
  if (power === null) return null
  const powers = config.teamBalance
    ? memberPowers(memberUnitIds, roster, config.unitPower)
    : null
  const factor = teamBalanceFactor(
    powers ? topMemberShare(powers) : null,
    config.teamBalance
  )
  return estimateClearDepth(power, battlePowers, config, factor)
}

/** A team of five like this unit (balanced, so with the team-balance factor of a 0.2 share); null when the roster does not hold it or its power is
 *  unavailable. */
export function unitClearEstimate(
  unitId: string,
  battlePowers: readonly number[],
  roster: ClearEstimateRoster,
  config: ClearEstimateConfig
): ClearEstimate | null {
  if (!roster.has(unitId)) return null
  const power = unitEffectivePower(unitId, roster, config)
  if (power === null) return null
  // Five equal members: the strongest holds a fifth of the power.
  const factor = teamBalanceFactor(1 / 5, config.teamBalance)
  return estimateClearDepth(5 * power, battlePowers, config, factor)
}

/** The depth to show and plan with (design D2): the run's manual depth, else the estimate. */
export function teamEffectiveDepth(
  manualDepth: number | null,
  estimate: Pick<ClearEstimate, "depth"> | null
): number | null {
  return manualDepth ?? estimate?.depth ?? null
}

/**
 * A lane's battle powers in battle order, each scaled by its enemies' NPC tier multipliers
 * (`npcAdjustedBattlePower`, weighted by each enemy's estimated power at its ladder row): the
 * thresholds a team's effective power is compared with. Equal to `laneBattlePowers` while every
 * enemy is untiered or at 1.0. Null while any of the lane's battles is missing.
 */
export function laneThresholdPowers(
  battleIds: readonly string[],
  battles: readonly (NpcTieredBattle & { id: string })[],
  config: Pick<ClearEstimateConfig, "npcMultipliers" | "unitPower">
): number[] | null {
  const multipliers = config.npcMultipliers ?? new Map<string, number>()
  const context = config.unitPower
  const enemyPower = (npcId: string, ladderIndex: number) =>
    context ? npcPowerAtLadder(npcId, ladderIndex, context) : null
  return laneBattlePowers(
    battleIds,
    battles.map((battle) => ({
      id: battle.id,
      power: npcAdjustedBattlePower(battle, multipliers, enemyPower),
    }))
  )
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
