import type { BattleId } from "@workspace/game-domain"

import type { RaidBreakdownEntry } from "@/features/goal-farming/@x/daily-raids"

import { clusterByCampaign, upgradeCampaignKey } from "./campaign-clustering"
import type {
  DailyRaidLocationViewModel,
  DailyRaidResourceUrgency,
} from "./daily-raids.domain"

/**
 * Combine goals: Today's entries in one combined order, by their resource's pooled urgency: longest
 * to finish first, then most energy to clear, the same order a goal's own upgrades take. A resource
 * without an urgency goes last; ties keep the run's own order, and a resource's entries stay
 * together. Same-campaign resources of similar energy are then pulled together
 * (`clusterByCampaign`).
 */
export function orderCombinedEntries<Entry extends RaidBreakdownEntry>(
  entries: readonly Entry[],
  urgencyByResource: ReadonlyMap<string, DailyRaidResourceUrgency>,
  locationsByBattleId: ReadonlyMap<
    BattleId,
    DailyRaidLocationViewModel
  > = new Map()
): Entry[] {
  const byResource = new Map<string, Entry[]>()
  for (const entry of entries) {
    const resourceEntries = byResource.get(entry.resourceId) ?? []
    resourceEntries.push(entry)
    byResource.set(entry.resourceId, resourceEntries)
  }
  const resources = [...byResource.entries()].sort(([left], [right]) => {
    const leftUrgency = urgencyByResource.get(left)
    const rightUrgency = urgencyByResource.get(right)
    const byDays = (rightUrgency?.days ?? -1) - (leftUrgency?.days ?? -1)
    if (byDays !== 0) return byDays
    return (rightUrgency?.energyTotal ?? -1) - (leftUrgency?.energyTotal ?? -1)
  })
  return clusterByCampaign(
    resources,
    ([, resourceEntries]) =>
      upgradeCampaignKey(resourceEntries, locationsByBattleId),
    ([resourceId]) => urgencyByResource.get(resourceId)?.energyTotal
  ).flatMap(([, resourceEntries]) => resourceEntries)
}
