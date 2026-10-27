import type { BattleId } from "@workspace/game-domain"

import type { RaidBreakdownEntry } from "@/features/goal-farming/@x/daily-raids"

import { isLocationVisible } from "./location-visibility"

export type TodayRaidsInput = {
  todayEntries: readonly RaidBreakdownEntry[]
  bonusEntries: readonly RaidBreakdownEntry[]
  /** Every raid still open today at the real attempts left; Bonus Raids once the limit is hit. */
  raidsLeftTodayEntries: readonly RaidBreakdownEntry[]
  attemptsLeftByBattle: ReadonlyMap<BattleId, number>
  /** The Planning Settings daily energy limit. */
  dailyEnergy: number
  /** Real, account-wide energy spent today per synced attempts (0 when nothing is synced). */
  realEnergyUsedToday: number
}

export type TodayRaidsSelection = {
  /** What the Today's-plan lane (and the Home raids widget) lists; empty once the limit is hit. */
  planEntries: RaidBreakdownEntry[]
  /** Bonus raids whose node still has real attempts left: below the limit, the materials the plan
   *  leaves unraided; once it is hit, every raid still open today, plan materials included. */
  bonusEntries: RaidBreakdownEntry[]
  /** True once today's real energy spend has reached the daily energy limit: Bonus Raids are then
   *  the only raids list. */
  energyLimitReached: boolean
}

/** Today's real energy spend has reached the daily energy limit (a limit of 0 or less is none). */
const isEnergyLimitReached = (
  dailyEnergy: number,
  realEnergyUsedToday: number
) => dailyEnergy > 0 && realEnergyUsedToday >= dailyEnergy

/**
 * Decides what Today lists, shared by Dailies > Today and the Home raids widget
 * (daily-raids-today / home-raids-widget specs). Below the daily energy limit the plan stands and
 * the visible bonus raids keep their own list. Once the real energy spent today reaches the limit,
 * the plan is dropped and Bonus Raids become the only raids list, now listing every raid still open
 * today (the plan's partly-raided materials included) at the real attempts left. A limit of 0 or less is treated
 * as no limit, and with no synced attempts the energy spent is 0, so nothing changes then. Bonus
 * entries whose node is exhausted are always dropped.
 */
export function selectTodayRaids({
  todayEntries,
  bonusEntries,
  raidsLeftTodayEntries,
  attemptsLeftByBattle,
  dailyEnergy,
  realEnergyUsedToday,
}: TodayRaidsInput): TodayRaidsSelection {
  const energyLimitReached = isEnergyLimitReached(
    dailyEnergy,
    realEnergyUsedToday
  )
  const visibleBonus = (
    energyLimitReached ? raidsLeftTodayEntries : bonusEntries
  ).filter((entry) => isLocationVisible(entry, attemptsLeftByBattle))
  return {
    planEntries: energyLimitReached ? [] : [...todayEntries],
    bonusEntries: visibleBonus,
    energyLimitReached,
  }
}
