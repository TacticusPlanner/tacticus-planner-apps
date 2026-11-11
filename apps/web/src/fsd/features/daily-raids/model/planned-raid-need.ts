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
 *
 * The count is the goal's whole need for the material (`materialNeed`), not what is left after the
 * expected drops of the nodes planned before this one: drops are random and the player may raid the
 * nodes in any order, so "N more" must match the owned/target progress shown on the card.
 */
export function plannedRaidNeed(entry: {
  resourceId: string
  raidsPerformed: number
  dailyAttempts: number
  remainingBefore: number
  /** The goal's need for `resourceId` before today's raids at any of its nodes; defaults to
   *  `remainingBefore`. */
  materialNeed?: number
  /** Expected drops of `resourceId` per raid at this node. */
  dropRate: number
}): PlannedRaidNeed | undefined {
  if (entry.dailyAttempts > 0) {
    if (entry.raidsPerformed >= entry.dailyAttempts) return undefined
    if (entry.dailyAttempts * entry.dropRate < entry.remainingBefore - EPSILON)
      return undefined
  }
  const count = Math.ceil(
    Math.max(entry.materialNeed ?? 0, entry.remainingBefore) - EPSILON
  )
  if (count <= 0) return undefined
  return {
    count,
    unit: isShardResource(entry.resourceId) ? "shards" : "upgrades",
  }
}

/** `plannedRaidNeed` for one breakdown entry, its drop rate taken from the planned raids. Pass the
 *  `materialNeed` of the card's entries for the same material. */
export function plannedRaidNeedForEntry(
  entry: Pick<
    RaidBreakdownEntry,
    | "resourceId"
    | "raidsPerformed"
    | "dailyAttempts"
    | "remainingBefore"
    | "itemsFarmed"
  >,
  need?: number
): PlannedRaidNeed | undefined {
  return plannedRaidNeed({
    ...entry,
    materialNeed: need,
    dropRate: entryDropRate(entry),
  })
}

type NeedEntry = Pick<
  RaidBreakdownEntry,
  "goalId" | "resourceId" | "remainingBefore"
>

/** Map key of one goal's need for one material. */
export function goalMaterialKey(entry: NeedEntry): string {
  return `${entry.goalId}\u0000${entry.resourceId}`
}

/** Each goal's need for each material before today's raids: the largest `remainingBefore` among its
 *  entries for that material (the first node planned sees the whole need). */
export function goalMaterialNeeds(
  entries: readonly NeedEntry[]
): Map<string, number> {
  const needs = new Map<string, number>()
  for (const entry of entries) {
    const key = goalMaterialKey(entry)
    needs.set(key, Math.max(needs.get(key) ?? 0, entry.remainingBefore))
  }
  return needs
}

/** The need for one material across the goals of `entries` (all for that material) before today's
 *  raids: each goal's whole need, summed (a combined card lists several goals' entries). */
export function materialNeed(entries: readonly NeedEntry[]): number {
  let need = 0
  for (const goalNeed of goalMaterialNeeds(entries).values()) need += goalNeed
  return need
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
