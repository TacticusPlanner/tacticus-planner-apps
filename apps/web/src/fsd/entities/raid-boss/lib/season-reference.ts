import type {
  RaidBossEncounterLocation,
  RaidBossesPayload,
  ResolvedRaidBossEncounterLocation,
} from "../model/types"

export type RaidBossSeasonBoard = {
  seasonId: string
  tiers: {
    tier: number
    sets: {
      set: number
      encounters: ResolvedRaidBossEncounterLocation[]
    }[]
  }[]
}

/** The rotation is authoritative; ignore orphaned payload entries. */
export function validRaidBossSeasonIds(payload: RaidBossesPayload): string[] {
  return payload.seasonConfigRotation.filter((id) => payload.seasons[id])
}

export function resolveRaidBossSeasonId(
  payload: RaidBossesPayload,
  requested?: string | null
): string | undefined {
  const ids = validRaidBossSeasonIds(payload)
  return requested && ids.includes(requested) ? requested : ids[0]
}

/** A presentation-neutral, fully located projection for the season reference. */
export function buildRaidBossSeasonBoard(
  payload: RaidBossesPayload,
  seasonId: string
): RaidBossSeasonBoard | undefined {
  const season = payload.seasons[seasonId]
  if (!season || !validRaidBossSeasonIds(payload).includes(seasonId)) {
    return undefined
  }

  return {
    seasonId,
    tiers: [...season.tiers]
      .sort((a, b) => b.tier - a.tier)
      .map((tier) => ({
        tier: tier.tier,
        sets: [...tier.sets]
          .sort((a, b) => b.set - a.set)
          .map((set) => ({
            set: set.set,
            encounters: set.encounters.map((encounter) => ({
              seasonId,
              tier: tier.tier,
              set: set.set,
              encounterIndex: encounter.encounterIndex,
              encounter,
              setEncounters: set.encounters,
            })),
          })),
      })),
  }
}

/** Returns a location only when every segment exists and belongs to the route entity. */
export function resolveRaidBossEncounterLocation(
  payload: RaidBossesPayload,
  unitSetId: string,
  location: RaidBossEncounterLocation | undefined
): ResolvedRaidBossEncounterLocation | undefined {
  if (
    !location ||
    !validRaidBossSeasonIds(payload).includes(location.seasonId)
  ) {
    return undefined
  }
  const season = payload.seasons[location.seasonId]
  const tier = season?.tiers.find((item) => item.tier === location.tier)
  const set = tier?.sets.find((item) => item.set === location.set)
  const encounter = set?.encounters.find(
    (item) => item.encounterIndex === location.encounterIndex
  )
  if (!set || !encounter || encounter.unitSetId !== unitSetId) return undefined

  return { ...location, encounter, setEncounters: set.encounters }
}

export function encounterProgressionStepIndex(
  progressionIndex: number,
  ladderLength: number
): number {
  return Math.min(
    Math.max(progressionIndex - 1, 0),
    Math.max(ladderLength - 1, 0)
  )
}
