import { useMemo } from "react"
import type { RaidBossesStorageModel } from "@workspace/game-catalog"

import {
  buildGuildRaidRosterInvestment,
  resolveGuildRaidLiveInvestmentThreshold,
  resolveGuildRaidRecommendationsReadiness,
  useGuildRaidMetaCatalog,
  type GuildRaidRecommendationReadiness,
} from "@/entities/guild-raid-meta"
import { useCatalogDataset, usePlayerChunk } from "@/shared/local-data"

export type GuildRaidInvestmentReadinessQuery =
  | { status: "unavailable" }
  | {
      status: "ready"
      byRecommendationId: ReadonlyMap<string, GuildRaidRecommendationReadiness>
    }

const toBosses = (rows: RaidBossesStorageModel[]) => rows[0]?.bosses ?? null

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
  const bossesRead = useCatalogDataset("raid-bosses", toBosses)
  const charactersRead = usePlayerChunk("characters")
  const mowsRead = usePlayerChunk("mows")
  // A failed read is "unavailable" too: the card keeps its ownership-only display.
  const bosses = bossesRead.status === "ready" ? bossesRead.data : null
  const characters =
    charactersRead.status === "ready" ? charactersRead.data : null
  const mows = mowsRead.status === "ready" ? mowsRead.data : null

  return useMemo((): GuildRaidInvestmentReadinessQuery => {
    // An unsynced roster chunk reads as null, like one still loading.
    if (catalog.status !== "ready" || !bosses || !characters || !mows) {
      return { status: "unavailable" }
    }

    const bossCatalogRecord = bosses.find(
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
      characters,
      mows,
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
    bosses,
    characters,
    mows,
    bossUnitSetId,
    isObservationActive,
    liveProgressionIndex,
  ])
}
