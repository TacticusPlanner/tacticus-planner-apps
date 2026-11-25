import { rarityOrder } from "@workspace/game-domain"
import type { Rarity } from "@workspace/game-domain"

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
    /** The tier's rarity: tiers run Common (0) to Mythic (5), as the season's chests do. */
    rarity: Rarity | undefined
    sets: {
      set: number
      /** 1-based, as players count sets. */
      setNumber: number
      /** The set's boss, named in its heading; `undefined` when the set has none. */
      bossName: string | undefined
      /** The boss first, then its primes in authored order. */
      encounters: RaidBossSeasonReferenceCard[]
    }[]
  }[]
}

const bossFirst = (
  a: RaidBossSeasonReferenceCard,
  b: RaidBossSeasonReferenceCard
) => Number(b.item.kind === "boss") - Number(a.item.kind === "boss")

/**
 * Adds display-ready labels and portrait fallbacks to an entity-owned season board: each tier's
 * rarity, sets in play order (first encountered first) named by their boss, and the boss tile
 * before its primes.
 */
export function buildRaidBossSeasonReferenceViewModel(
  board: RaidBossSeasonBoard,
  itemsById: Map<string, RaidBossListItem>
): RaidBossSeasonReferenceViewModel {
  return {
    seasonId: board.seasonId,
    tiers: board.tiers.map((tier) => ({
      tier: tier.tier,
      rarity: rarityOrder[tier.tier],
      sets: tier.sets
        .toSorted((a, b) => a.set - b.set)
        .map((set) => {
          const encounters = set.encounters
            .flatMap((location) => {
              const item = itemsById.get(location.encounter.unitSetId)
              return item ? [{ ...location, item }] : []
            })
            .toSorted(bossFirst)
          return {
            set: set.set,
            setNumber: set.set + 1,
            bossName: encounters.find((card) => card.item.kind === "boss")?.item
              .name,
            encounters,
          }
        }),
    })),
  }
}
