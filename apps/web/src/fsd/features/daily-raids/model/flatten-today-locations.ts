import type { BattleId } from "@workspace/game-domain"
import type { RaidBreakdownEntry } from "@/features/goal-farming/@x/daily-raids"

import { isLocationVisible } from "./location-visibility"

export type FlattenedRaidLocation = {
  battleId: BattleId
  resourceId: string
  raidsToPerform: number
  dailyAttempts: number
  /** Summed over the merged entries that farm the row's `resourceId` (see `plannedRaidNeed`). */
  remainingBefore: number
}

/**
 * Collapses today's real (energy-budget) schedule entries to one row per battle location,
 * regardless of which goal(s) contributed to it — the home Daily Raids widget's "one location
 * per row, no relation to character" requirement (home-raids-widget spec). Entries sharing a
 * `battleId` are merged by summing `raidsPerformed`; a location whose real synced attempts today
 * are exhausted (`isLocationVisible` false) is dropped entirely, and a zero-raid entry is skipped.
 * Pass the list `selectTodayRaids` picks (today's plan, or Bonus Raids once the daily energy limit
 * is spent) — never `todaysAttempts`, which is out of scope for this widget.
 */
export function flattenTodayLocations(
  entries: readonly RaidBreakdownEntry[],
  attemptsLeftByBattle: ReadonlyMap<BattleId, number>
): FlattenedRaidLocation[] {
  const byBattle = new Map<BattleId, FlattenedRaidLocation>()
  for (const entry of entries) {
    if (entry.raidsPerformed <= 0) continue
    if (!isLocationVisible(entry, attemptsLeftByBattle)) continue
    const existing = byBattle.get(entry.battleId)
    if (existing) {
      existing.raidsToPerform += entry.raidsPerformed
      if (entry.resourceId === existing.resourceId) {
        existing.remainingBefore += entry.remainingBefore
      }
    } else {
      byBattle.set(entry.battleId, {
        battleId: entry.battleId,
        resourceId: entry.resourceId,
        raidsToPerform: entry.raidsPerformed,
        dailyAttempts: entry.dailyAttempts,
        remainingBefore: entry.remainingBefore,
      })
    }
  }
  return [...byBattle.values()]
}
