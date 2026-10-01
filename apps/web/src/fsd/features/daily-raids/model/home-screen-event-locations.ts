import type { BattleId } from "@workspace/game-domain"

const TOP_LOCATIONS_LIMIT = 10

/** One ranked location for the active Home Screen Event. */
export type TopEventLocation = {
  battleId: BattleId
  pointsPerRaid: number
  pointsPerEnergy: number
  energyCost: number
}

/**
 * The best locations for event points: ranked by points per energy, ties by higher points per raid
 * then lower energy cost (then battle id, so the order is deterministic). `battles` is the
 * eligible set (unlocked by campaign progress; event-campaign nodes only while their event is
 * active). A location is left out when it was raided today, fails the Raids Filters
 * (`passesFilter`), scores zero, or - with `campaignGroupId` - belongs to another campaign.
 */
export function selectTopEventLocations({
  battles,
  pointsByBattleId,
  raidedToday,
  passesFilter,
  campaignGroupId,
  limit = TOP_LOCATIONS_LIMIT,
}: {
  battles: readonly {
    id: string
    campaignGroupId: string
    energyCost: number
  }[]
  pointsByBattleId: ReadonlyMap<string, number>
  raidedToday: ReadonlySet<string>
  passesFilter: (battleId: string) => boolean
  campaignGroupId?: string
  limit?: number
}): TopEventLocation[] {
  const ranked: TopEventLocation[] = []
  for (const battle of battles) {
    if (campaignGroupId && battle.campaignGroupId !== campaignGroupId) continue
    if (battle.energyCost <= 0 || raidedToday.has(battle.id)) continue
    const pointsPerRaid = pointsByBattleId.get(battle.id) ?? 0
    if (pointsPerRaid <= 0 || !passesFilter(battle.id)) continue
    ranked.push({
      battleId: battle.id as BattleId,
      pointsPerRaid,
      pointsPerEnergy: pointsPerRaid / battle.energyCost,
      energyCost: battle.energyCost,
    })
  }
  return ranked
    .sort(
      (a, b) =>
        b.pointsPerEnergy - a.pointsPerEnergy ||
        b.pointsPerRaid - a.pointsPerRaid ||
        a.energyCost - b.energyCost ||
        a.battleId.localeCompare(b.battleId)
    )
    .slice(0, limit)
}
