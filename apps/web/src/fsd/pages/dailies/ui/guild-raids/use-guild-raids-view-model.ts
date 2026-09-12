import { useEffect, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { getPlayerDataMetadata } from "@workspace/player-data"
import { getLiveProgress } from "@workspace/player-data/queries"

import { useGuildRaidStatus } from "@/entities/guild-raid-status"

import {
  buildGuildRaidResourcesView,
  buildGuildRaidStatusView,
  type GuildRaidsViewModel,
} from "./guild-raid-status-view-model"
import { useGuildRaidCatalog } from "./use-guild-raid-catalog"

// Re-renders live "in 2 hours" / "3 hours ago" style copy without polling any data source — matches
// the sidebar sync button's relative-time refresh cadence (see player-data-sync-button.tsx).
const nowTickMs = 30 * 1000

async function readPlayerGuildRaidTokens() {
  const [liveProgress, metadata] = await Promise.all([
    getLiveProgress(),
    getPlayerDataMetadata(),
  ])

  return {
    guildRaidTokens: liveProgress?.gameModeTokens.guildRaid ?? null,
    observedAt: metadata.get("live-progress")?.updatedAt,
  }
}

/** Combines persisted Guild Raid status, the local raid-boss catalog, and synced player resources into
 * the single view model the desktop/mobile Guild Raids regions render from. */
export function useGuildRaidsViewModel(): GuildRaidsViewModel {
  const { query, refresh, isRefreshing, refreshError } = useGuildRaidStatus()
  const catalog = useGuildRaidCatalog()
  const playerTokens = useLiveQuery(readPlayerGuildRaidTokens, [])

  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), nowTickMs)
    return () => window.clearInterval(interval)
  }, [])

  const status = buildGuildRaidStatusView({
    query: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    retry: () => {
      void query.refetch()
    },
    catalog,
    nowMs,
  })

  const resources = buildGuildRaidResourcesView({
    guildRaidTokens: playerTokens?.guildRaidTokens ?? null,
    observedAtMs: playerTokens?.observedAt
      ? Date.parse(playerTokens.observedAt)
      : undefined,
    nowMs,
  })

  return {
    status,
    resources,
    refresh,
    isRefreshing,
    hasRefreshError: refreshError !== null,
  }
}
