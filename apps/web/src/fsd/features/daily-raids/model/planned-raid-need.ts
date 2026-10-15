import type { RaidBreakdownEntry } from "@/features/goal-farming/@x/daily-raids"

/** What a planned node row says instead of a raid count (drops are random, so a planned count is
 *  only an estimate). */
export type PlannedRaidNeed = {
  count: number
  unit: "upgrades" | "shards"
}

// `remainingBefore` is a sum of fractional expected drops; absorb float noise before rounding up.
const EPSILON = 1e-9

/**
 * A planned node whose raids reach its daily attempt cap gets no label: the player raids it out.
 * Below the cap the plan stops early (need or energy runs out), so the row names how many of the
 * resource the goal still needs when it reaches this node.
 */
export function plannedRaidNeed(
  entry: Pick<
    RaidBreakdownEntry,
    "raidsPerformed" | "dailyAttempts" | "remainingBefore"
  > & { resourceId: string }
): PlannedRaidNeed | undefined {
  if (entry.dailyAttempts > 0 && entry.raidsPerformed >= entry.dailyAttempts) {
    return undefined
  }
  const count = Math.ceil(entry.remainingBefore - EPSILON)
  if (count <= 0) return undefined
  return {
    count,
    unit: isShardResource(entry.resourceId) ? "shards" : "upgrades",
  }
}

function isShardResource(resourceId: string): boolean {
  return (
    resourceId.startsWith("shard:") || resourceId.startsWith("mythic-shard:")
  )
}
