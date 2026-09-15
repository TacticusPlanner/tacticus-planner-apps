import { useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { getRaidBosses } from "@workspace/game-catalog/queries"
import {
  getPlayerCharacters,
  getPlayerMows,
} from "@workspace/player-data/queries"

import {
  buildGuildRaidRosterInvestment,
  resolveGuildRaidLiveInvestmentThreshold,
  resolveGuildRaidRecommendationsReadiness,
  useGuildRaidMetaCatalog,
  type GuildRaidRecommendationReadiness,
} from "@/entities/guild-raid-meta"

export type GuildRaidInvestmentReadinessQuery =
  | { status: "unavailable" }
  | {
      status: "ready"
      byRecommendationId: ReadonlyMap<string, GuildRaidRecommendationReadiness>
    }

async function readOwnedRoster() {
  const [characters, mows] = await Promise.all([
    getPlayerCharacters(),
    getPlayerMows(),
  ])
  return { characters, mows }
}

/**
 * Composes the three data sources the investment-readiness percentage needs — the curated Meta
 * recommendations, the boss's catalog `statProgression`, and the live current step — and stays
 * independent of the `guild-raid-status` entity by taking its two derived values as plain parameters
 * (see `resolveGuildRaidLiveInvestmentThreshold`). `status: "unavailable"` is this hook's signal for
 * the caller to fall back to the existing ownership-only display, not an error: it covers a missing
 * live status, an unresolvable threshold, and a still-loading roster/catalog alike.
 */
export function useGuildRaidInvestmentReadiness(params: {
  bossUnitSetId: string
  isObservationActive: boolean
  liveProgressionIndex: number | undefined
}): GuildRaidInvestmentReadinessQuery {
  const { bossUnitSetId, isObservationActive, liveProgressionIndex } = params

  const catalog = useGuildRaidMetaCatalog()
  const raidBosses = useLiveQuery(() => getRaidBosses(), [])
  const roster = useLiveQuery(readOwnedRoster, [])

  return useMemo((): GuildRaidInvestmentReadinessQuery => {
    if (catalog.status !== "ready" || !raidBosses || !roster) {
      return { status: "unavailable" }
    }

    const isRosterSynced =
      roster.characters !== undefined && roster.mows !== undefined
    if (!isRosterSynced) return { status: "unavailable" }

    const bossCatalogRecord = raidBosses.bosses.find(
      (boss) => boss.unitSetId === bossUnitSetId
    )
    if (!bossCatalogRecord) return { status: "unavailable" }

    const threshold = resolveGuildRaidLiveInvestmentThreshold({
      boss: bossCatalogRecord,
      isObservationActive,
      liveProgressionIndex,
    })
    if (!threshold) return { status: "unavailable" }

    const bossMeta = catalog.meta.bosses.find(
      (boss) => boss.bossUnitSetId === bossUnitSetId
    )
    if (!bossMeta) return { status: "unavailable" }

    const roosterInvestment = buildGuildRaidRosterInvestment({
      characters: roster.characters!,
      mows: roster.mows!,
    })

    const results = resolveGuildRaidRecommendationsReadiness({
      recommendations: bossMeta.recommendations,
      threshold,
      roster: roosterInvestment,
    })

    return {
      status: "ready",
      byRecommendationId: new Map(
        results.map((result) => [result.recommendation.id, result])
      ),
    }
  }, [
    catalog,
    raidBosses,
    roster,
    bossUnitSetId,
    isObservationActive,
    liveProgressionIndex,
  ])
}
