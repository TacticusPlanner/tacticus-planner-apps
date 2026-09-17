import type { BattleId } from "@workspace/game-domain"
import type { RaidBreakdownEntry } from "@/features/goal-farming/@x/daily-raids"

import { isLocationVisible } from "./location-visibility"

export type FlattenedRaidLocation = {
  battleId: BattleId
  resourceId: string
  raidsToPerform: number
  dailyAttempts: number
}

/**
 * Collapses today's real (energy-budget) schedule entries to one row per battle location,
 * regardless of which goal(s) contributed to it — the home Daily Raids widget's "one location
 * per row, no relation to character" requirement (home-raids-widget spec). Entries sharing a
 * `battleId` are merged by summing `raidsPerformed`; a location whose real synced attempts today
 * are exhausted (`isLocationVisible` false) is dropped entirely, and a zero-raid entry is skipped.
 * Only pass `today.entries` (never `bonus.entries` or `todaysAttempts`) — Bonus Raids and Today's
 * Attempts are out of scope for this widget by construction, not by filtering here.
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
    } else {
      byBattle.set(entry.battleId, {
        battleId: entry.battleId,
        resourceId: entry.resourceId,
        raidsToPerform: entry.raidsPerformed,
        dailyAttempts: entry.dailyAttempts,
      })
    }
  }
  return [...byBattle.values()]
}
