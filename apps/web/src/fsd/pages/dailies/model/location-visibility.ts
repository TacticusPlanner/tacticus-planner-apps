import type { BattleId } from "@workspace/game-domain"

import type { RaidBreakdownEntry } from "@/features/goal-farming"

/** Whether a location still has real attempts left today (or has no real data at all, e.g. an
 * event-campaign node — treated as "not exhausted" rather than guessed at). Shared between
 * `ResourceCard`'s own per-entry filtering and `RaidSchedule`'s goal-group visibility check, so a
 * goal group whose every resource is fully de-duped away doesn't render an empty section. */
export function isLocationVisible(
  entry: Pick<RaidBreakdownEntry, "battleId">,
  attemptsLeftByBattle: ReadonlyMap<BattleId, number>
): boolean {
  return attemptsLeftByBattle.get(entry.battleId) !== 0
}
