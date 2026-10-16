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
 * A row only names what is left when the node's full daily attempts are expected to cover it, so
 * the player knows they can stop early. When even a full day of attempts would not drop that much
 * (or the plan already raids the node to its cap), the player raids it out and the row says nothing.
 * A node without a daily cap can always cover the need.
 */
export function plannedRaidNeed(entry: {
  resourceId: string
  raidsPerformed: number
  dailyAttempts: number
  remainingBefore: number
  /** Expected drops of `resourceId` per raid at this node. */
  dropRate: number
}): PlannedRaidNeed | undefined {
  if (entry.dailyAttempts > 0) {
    if (entry.raidsPerformed >= entry.dailyAttempts) return undefined
    if (entry.dailyAttempts * entry.dropRate < entry.remainingBefore - EPSILON)
      return undefined
  }
  const count = Math.ceil(entry.remainingBefore - EPSILON)
  if (count <= 0) return undefined
  return {
    count,
    unit: isShardResource(entry.resourceId) ? "shards" : "upgrades",
  }
}

/** `plannedRaidNeed` for one goal's breakdown entry, its drop rate taken from the planned raids. */
export function plannedRaidNeedForEntry(
  entry: Pick<
    RaidBreakdownEntry,
    | "resourceId"
    | "raidsPerformed"
    | "dailyAttempts"
    | "remainingBefore"
    | "itemsFarmed"
  >
): PlannedRaidNeed | undefined {
  return plannedRaidNeed({ ...entry, dropRate: entryDropRate(entry) })
}

/** Expected drops per raid of a breakdown entry; 0 for an entry with no raids. */
export function entryDropRate(
  entry: Pick<RaidBreakdownEntry, "raidsPerformed" | "itemsFarmed">
): number {
  return entry.raidsPerformed > 0 ? entry.itemsFarmed / entry.raidsPerformed : 0
}

function isShardResource(resourceId: string): boolean {
  return (
    resourceId.startsWith("shard:") || resourceId.startsWith("mythic-shard:")
  )
}
