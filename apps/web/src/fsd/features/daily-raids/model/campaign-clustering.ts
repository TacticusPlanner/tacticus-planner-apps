import type { BattleId } from "@workspace/game-domain"

import type { DailyRaidLocationViewModel } from "./daily-raids.domain"

/** Two upgrades are of similar priority when their energy to clear is at most this far apart. */
export const CAMPAIGN_CLUSTER_ENERGY_WINDOW = 50

/**
 * Pulls same-campaign upgrades of similar priority together, so going down Today's list the player
 * stays in one campaign and only switches battles. `items` must already be in priority order. Going
 * down it, each item not yet placed is placed, then every later unplaced item in the same campaign
 * whose energy is within `CAMPAIGN_CLUSTER_ENERGY_WINDOW` of *that item's* energy follows it, in its
 * own order. A pulled item does not pull others in turn (no chaining), and an item with no campaign
 * or energy keeps its place.
 */
export function clusterByCampaign<Item>(
  items: readonly Item[],
  campaignOf: (item: Item) => string | undefined,
  energyOf: (item: Item) => number | undefined
): Item[] {
  const keyed = items.map((item) => ({
    item,
    campaign: campaignOf(item),
    energy: energyOf(item),
  }))
  const placed = new Set<number>()
  const ordered: Item[] = []
  for (const [index, leader] of keyed.entries()) {
    if (placed.has(index)) continue
    placed.add(index)
    ordered.push(leader.item)
    if (leader.campaign === undefined || leader.energy === undefined) continue
    for (let next = index + 1; next < keyed.length; next++) {
      const candidate = keyed[next]
      if (
        !candidate ||
        placed.has(next) ||
        candidate.campaign !== leader.campaign ||
        candidate.energy === undefined ||
        Math.abs(candidate.energy - leader.energy) >
          CAMPAIGN_CLUSTER_ENERGY_WINDOW
      ) {
        continue
      }
      placed.add(next)
      ordered.push(candidate.item)
    }
  }
  return ordered
}

/**
 * The campaign an upgrade is farmed in: the campaign (with its difficulty, so Indomitus, Indomitus
 * Elite and Indomitus Mirror Elite differ) of its first planned location, which is the plan's best
 * node for that goal. `undefined` when the location is not in the catalog.
 */
export function upgradeCampaignKey(
  entries: readonly { battleId: BattleId }[],
  locationsByBattleId: ReadonlyMap<BattleId, DailyRaidLocationViewModel>
): string | undefined {
  const first = entries[0]
  return first
    ? locationsByBattleId.get(first.battleId)?.campaignKey
    : undefined
}
