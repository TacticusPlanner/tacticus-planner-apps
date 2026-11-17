import type { BattleId } from "@workspace/game-domain"

import type { RaidBreakdownEntry } from "@/entities/goal-farming"

/** Whether a location still has real attempts left today (or has no real data at all — treated as
 * "not exhausted" rather than guessed at; this now applies to standing and event-campaign nodes
 * alike, since `attemptsLeftByBattle` covers both). Shared between `ResourceCard`'s own per-entry
 * filtering and `RaidSchedule`'s goal-group visibility check, so a goal group whose every resource is
 * fully de-duped away doesn't render an empty section. */
export function isLocationVisible(
  entry: Pick<RaidBreakdownEntry, "battleId">,
  attemptsLeftByBattle: ReadonlyMap<BattleId, number>
): boolean {
  return attemptsLeftByBattle.get(entry.battleId) !== 0
}

/** The entries `ResourceCard` lists as location rows: those still visible today, each battle once.
 * Combine goals lists a location once per goal that farms it there; one row is enough, as in the
 * campaign groups (`groupScheduleByCampaign`). */
export function visibleLocationEntries<
  Entry extends Pick<RaidBreakdownEntry, "battleId">,
>(
  entries: readonly Entry[],
  attemptsLeftByBattle: ReadonlyMap<BattleId, number>
): Entry[] {
  const seen = new Set<BattleId>()
  return entries.filter((entry) => {
    if (seen.has(entry.battleId)) return false
    seen.add(entry.battleId)
    return isLocationVisible(entry, attemptsLeftByBattle)
  })
}
