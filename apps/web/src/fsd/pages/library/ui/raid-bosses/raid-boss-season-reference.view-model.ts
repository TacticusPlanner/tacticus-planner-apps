import type {
  RaidBossListItem,
  RaidBossSeasonBoard,
  ResolvedRaidBossEncounterLocation,
} from "@/entities/raid-boss"

type RaidBossSeasonReferenceCard = ResolvedRaidBossEncounterLocation & {
  item: RaidBossListItem
}

export type RaidBossSeasonReferenceViewModel = {
  seasonId: string
  tiers: {
    tier: number
    sets: {
      set: number
      encounters: RaidBossSeasonReferenceCard[]
    }[]
  }[]
}

/** Adds display-ready labels and portrait fallbacks to an entity-owned season board. */
export function buildRaidBossSeasonReferenceViewModel(
  board: RaidBossSeasonBoard,
  itemsById: Map<string, RaidBossListItem>
): RaidBossSeasonReferenceViewModel {
  return {
    seasonId: board.seasonId,
    tiers: board.tiers.map((tier) => ({
      tier: tier.tier,
      sets: tier.sets.map((set) => ({
        set: set.set,
        encounters: set.encounters.flatMap((location) => {
          const item = itemsById.get(location.encounter.unitSetId)
          return item ? [{ ...location, item }] : []
        }),
      })),
    })),
  }
}
