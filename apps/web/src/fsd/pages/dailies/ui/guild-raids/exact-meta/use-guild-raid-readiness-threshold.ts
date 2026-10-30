import { useMemo } from "react"
import type { RaidBossesStorageModel } from "@workspace/game-catalog"

import {
  resolveGuildRaidLiveInvestmentThreshold,
  type GuildRaidInvestmentThreshold,
} from "@/entities/guild-raid-meta"
import { useCatalogDataset } from "@/shared/local-data"

const toBosses = (rows: RaidBossesStorageModel[]) => rows[0]?.bosses ?? null

/**
 * The active boss's investment target at the guild's live current step, composed from the boss's
 * catalog `statProgression` and the live status. Stays independent of the `guild-raid-status` entity
 * by taking its two derived values as plain parameters (see
 * `resolveGuildRaidLiveInvestmentThreshold`). `null` covers a missing live status, a boss with no
 * catalog record, and a still-loading or failed catalog read alike: the lineups then show picks and
 * status without percentages.
 */
export function useGuildRaidReadinessThreshold(params: {
  bossUnitSetId: string
  isObservationActive: boolean
  liveProgressionIndex: number | undefined
}): GuildRaidInvestmentThreshold | null {
  const { bossUnitSetId, isObservationActive, liveProgressionIndex } = params
  const bossesRead = useCatalogDataset("raid-bosses", toBosses)
  const bosses = bossesRead.status === "ready" ? bossesRead.data : null

  return useMemo(() => {
    const boss = bosses?.find(
      (candidate) => candidate.unitSetId === bossUnitSetId
    )
    if (!boss) return null

    return resolveGuildRaidLiveInvestmentThreshold({
      boss,
      isObservationActive,
      liveProgressionIndex,
    })
  }, [bosses, bossUnitSetId, isObservationActive, liveProgressionIndex])
}
