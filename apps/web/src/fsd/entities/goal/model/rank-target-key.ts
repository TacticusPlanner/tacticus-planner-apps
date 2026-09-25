import { Rank, rankAt, rankIndex } from "@workspace/game-domain"

import type { GoalDetail, RankTarget } from "./types"

/**
 * The normalized identity of a Rank goal's *end* target — the same `"<rank>:<slots>"` key the API
 * uses for Rank slot occupancy (`RankTargetKey` in tacticus-planner-api) and returns as
 * `normalizedTarget` on a slot conflict. Start/baseline and farming strategy are not part of it.
 * Below Adamantine1 a rank's upgrades are a 3-slot row and point-five means all 3 (so point-five and
 * "3 applied" are one target); from Adamantine1 the applied count stands as-is and point-five carries
 * no meaning. Keep this in step with the server's rule, which stays authoritative under concurrency.
 */
export function rankTargetKey(
  target: Pick<RankTarget, "end" | "endPointFive" | "endAppliedUpgrades">
): string {
  let slots = Math.max(target.endAppliedUpgrades, 0)
  if (target.end < rankIndex(Rank.Adamantine1)) {
    slots = target.endPointFive ? 3 : Math.min(slots, 3)
  }
  return `${target.end}:${slots}`
}

/** The rank and applied-slot count a normalized target key names (for labelling a conflict), or null when
 * the key is malformed. `slots` is 0 for a clean rank boundary; from Adamantine1 it is the count as-is, and
 * below it a point-five target reads as 3. */
export function describeRankTargetKey(
  key: string
): { rank: Rank; slots: number } | null {
  const [end, slots, ...rest] = key.split(":").map(Number)
  return rest.length === 0 && Number.isInteger(end) && Number.isInteger(slots)
    ? { rank: rankAt(end!), slots: slots! }
    : null
}

/** The Rank target key of a goal, or null for any non-Rank goal (or a Rank goal without a target). */
export function goalRankTargetKey(
  goal: Pick<GoalDetail, "goalType" | "config">
): string | null {
  return goal.goalType === "Rank" && goal.config.rank
    ? rankTargetKey(goal.config.rank)
    : null
}
