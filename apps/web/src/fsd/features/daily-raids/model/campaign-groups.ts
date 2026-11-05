import type { BattleId } from "@workspace/game-domain"

import type { RaidBreakdownEntry } from "@/features/goal-farming/@x/daily-raids"

import type { DailyRaidLocationViewModel } from "./daily-raids.domain"

export type CampaignGroup<Entry extends RaidBreakdownEntry> = {
  /** The campaign's display name (mirror qualifier kept, no difficulty), or the raw battle id. */
  campaignName: string
  icon?: string
  /** The group's resources in the order they first appear, each with its locations in this campaign. */
  resources: { resourceId: string; entries: Entry[] }[]
}

/**
 * Today's "By campaign" view: entries regrouped by the campaign they are raided in, so the player
 * stays in one campaign and only switches battles. A campaign's Normal and Elite nodes share a group
 * (the difficulty is a tab inside the campaign). Groups keep the order in which their campaign first
 * appears in `entries`, so the campaign of the most important raid still comes first; inside a
 * group, resources and their locations keep the entries' own order, and a resource raided for
 * several goals is one card.
 */
export function groupEntriesByCampaign<Entry extends RaidBreakdownEntry>(
  entries: readonly Entry[],
  locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
): CampaignGroup<Entry>[] {
  const groups = new Map<
    string,
    { icon?: string; resources: Map<string, Entry[]> }
  >()
  for (const entry of entries) {
    const location = locationsByBattleId.get(entry.battleId)
    const campaignName = location?.campaignName ?? entry.battleId
    const group = groups.get(campaignName) ?? {
      icon: location?.icon,
      resources: new Map<string, Entry[]>(),
    }
    group.icon ??= location?.icon
    const resourceEntries = group.resources.get(entry.resourceId) ?? []
    // The same node raided for the same resource by two goals is one location row: their raids,
    // drops, energy and remaining need add up.
    const index = resourceEntries.findIndex(
      (existing) => existing.battleId === entry.battleId
    )
    const existing = index === -1 ? undefined : resourceEntries[index]
    if (existing) {
      resourceEntries[index] = {
        ...existing,
        raidsPerformed: existing.raidsPerformed + entry.raidsPerformed,
        itemsFarmed: existing.itemsFarmed + entry.itemsFarmed,
        energySpent: existing.energySpent + entry.energySpent,
        remainingBefore: existing.remainingBefore + entry.remainingBefore,
      }
    } else {
      resourceEntries.push(entry)
    }
    group.resources.set(entry.resourceId, resourceEntries)
    groups.set(campaignName, group)
  }
  return [...groups.entries()].map(([campaignName, { icon, resources }]) => ({
    campaignName,
    icon,
    resources: [...resources.entries()].map(
      ([resourceId, resourceEntries]) => ({
        resourceId,
        entries: resourceEntries,
      })
    ),
  }))
}
