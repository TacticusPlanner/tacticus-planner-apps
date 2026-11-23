import type { TFunction } from "i18next"
import { Rank, rankAt, rankIndex } from "@workspace/game-domain"

import type { GoalDetail, RankTarget } from "./types"

/**
 * The normalized identity of a Rank goal's *end* target — the same `"<rank>:<slots>"` key the API
 * uses for Rank slot occupancy (`RankTargetKey` in tacticus-planner-api) and returns as
 * `normalizedTarget` on a slot conflict. Start/baseline and farming strategy are not part of it.
 * Every rank numbers its slots individually, so the applied count stands as-is (up to 5); a
 * point-five (the whole top row, saved before every rank offered numbered targets) still reads as at
 * least 3 below Adamantine1 and carries no meaning from there on. Keep this in step with the server's
 * rule, which stays authoritative under concurrency.
 */
export function rankTargetKey(
  target: Pick<RankTarget, "end" | "endPointFive" | "endAppliedUpgrades">
): string {
  return `${target.end}:${rankTargetSlots(target)}`
}

/** The normalized applied-slot count of a Rank target's end (the key's second half): 0 at a clean
 * boundary, otherwise the applied count, with point-five reading as at least 3 below Adamantine1. */
export function rankTargetSlots(
  target: Pick<RankTarget, "end" | "endPointFive" | "endAppliedUpgrades">
): number {
  const slots = Math.max(target.endAppliedUpgrades, 0)
  return target.endPointFive && target.end < rankIndex(Rank.Adamantine1)
    ? Math.max(slots, 3)
    : slots
}

/** The rank and applied-slot count a normalized target key names (for labelling a conflict), or null when
 * the key is malformed. `slots` is 0 for a clean rank boundary. */
export function describeRankTargetKey(
  key: string
): { rank: Rank; slots: number } | null {
  const [end, slots, ...rest] = key.split(":").map(Number)
  return rest.length === 0 &&
    end !== undefined &&
    slots !== undefined &&
    Number.isInteger(end) &&
    Number.isInteger(slots)
    ? { rank: rankAt(end), slots }
    : null
}

/** "Silver3" or "Silver3 (3/6)" — the Rank end target a normalized target key stands for, or null when the
 * key is malformed. */
export function rankTargetKeyLabel(
  t: TFunction,
  rankTargetKey: string
): string | null {
  const target = describeRankTargetKey(rankTargetKey)
  if (!target) return null
  const rank = t(`ranks.${target.rank}`, {
    ns: "progression",
    defaultValue: target.rank,
  })
  return target.slots > 0 ? `${rank} (${target.slots}/6)` : rank
}

/** The Rank target key of a goal, or null for any non-Rank goal (or a Rank goal without a target). */
export function goalRankTargetKey(
  goal: Pick<GoalDetail, "goalType" | "config">
): string | null {
  return goal.goalType === "Rank" && goal.config.rank
    ? rankTargetKey(goal.config.rank)
    : null
}
