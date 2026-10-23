import { useEffect, useState } from "react"
import {
  getPlayerDataMetadata,
  type PlayerDataChunkDto,
} from "@workspace/player-data"

import { useGuildRaidStatus } from "@/entities/guild-raid-status"
import { useReadState } from "@/shared/lib"
import { usePlayerChunk } from "@/shared/local-data"

import {
  buildGuildRaidResourcesView,
  buildGuildRaidStatusView,
  type GuildRaidsViewModel,
} from "./guild-raid-status-view-model"
import { useGuildRaidCatalog } from "./use-guild-raid-catalog"

// Re-renders live "in 2 hours" / "3 hours ago" style copy without polling any data source — matches
// the sidebar sync button's relative-time refresh cadence (see player-data-sync-button.tsx).
const nowTickMs = 30 * 1000

const toGuildRaidTokens = (
  liveProgress: PlayerDataChunkDto<"live-progress"> | null
) => liveProgress?.gameModeTokens.guildRaid ?? null

async function readLiveProgressObservedAt() {
  return (await getPlayerDataMetadata()).get("live-progress")?.updatedAt ?? null
}

/** Combines persisted Guild Raid status, the local raid-boss catalog, and synced player resources into
 * the single view model the desktop/mobile Guild Raids regions render from. */
export function useGuildRaidsViewModel(): GuildRaidsViewModel {
  const { query, refresh, isRefreshing, refreshError } = useGuildRaidStatus()
  const catalog = useGuildRaidCatalog()
  // A failed read shows no resources, like a read still loading.
  const tokensRead = usePlayerChunk("live-progress", toGuildRaidTokens)
  // When the tokens were synced: the chunk's metadata, not its payload.
  const observedAtRead = useReadState(
    "live-progress-observed-at",
    readLiveProgressObservedAt,
    []
  )
  const observedAt =
    observedAtRead.status === "ready" ? observedAtRead.data : null

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
    guildRaidTokens: tokensRead.status === "ready" ? tokensRead.data : null,
    observedAtMs: observedAt ? Date.parse(observedAt) : undefined,
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
