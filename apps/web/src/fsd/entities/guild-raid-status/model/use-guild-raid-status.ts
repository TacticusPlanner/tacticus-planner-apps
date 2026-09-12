import { useCallback, useEffect, useRef } from "react"
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query"

import {
  refreshGuildRaidStatus,
  type GuildRaidStatusResult,
} from "../api/guild-raid-status.api"
import {
  guildRaidStatusQueries,
  guildRaidStatusQueryKey,
} from "../api/guild-raid-status.queries"

// A persisted observation over an hour old is treated as due for a background refresh — the same
// "sync at most hourly, but keep what's synced usable" gate `player-data-provider.tsx` uses, but
// checked exactly once per page mount instead of on a recurring interval: Guild Raid status only
// matters while the Guild Raids page is open, unlike player data the whole app depends on.
export const guildRaidAutoRefreshAfterMs = 60 * 60 * 1000

export type UseGuildRaidStatusResult = {
  query: UseQueryResult<GuildRaidStatusResult>
  refresh: () => void
  isRefreshing: boolean
  refreshError: unknown
}

function isDue(result: GuildRaidStatusResult, now: number): boolean {
  if (result.kind === "neverObserved") return true
  return (
    now - Date.parse(result.status.observedAt) > guildRaidAutoRefreshAfterMs
  )
}

/**
 * Reads persisted Guild Raid status immediately and, once per mount, checks whether it is stale enough
 * (or missing entirely) to warrant one background forced refresh. No recurring interval runs while the
 * page stays mounted — the next automatic check only happens on the next mount. `refresh` is also the
 * page's manual "refresh now" action; it's a no-op while a refresh is already pending so the page can
 * never have two forced refreshes in flight.
 */
export function useGuildRaidStatus(): UseGuildRaidStatusResult {
  const queryClient = useQueryClient()
  const query = useQuery(guildRaidStatusQueries.current())
  const hasCheckedMountRef = useRef(false)
  // Belt-and-suspenders alongside `mutation.isPending`: two synchronous `refresh()` calls (e.g. a
  // double click, or a click racing the mount-triggered auto-refresh) happen before React has
  // re-rendered with the pending state, so `isPending` alone would let both through.
  const isRefreshingRef = useRef(false)

  const mutation = useMutation({
    mutationFn: () => refreshGuildRaidStatus(),
    onSuccess: (status) => {
      const observed: GuildRaidStatusResult = { kind: "observed", status }
      queryClient.setQueryData(guildRaidStatusQueryKey, observed)
    },
    onSettled: () => {
      isRefreshingRef.current = false
    },
  })

  const mutate = mutation.mutate
  const startRefresh = useCallback(() => {
    if (isRefreshingRef.current) {
      return
    }
    isRefreshingRef.current = true
    mutate()
  }, [mutate])

  useEffect(() => {
    if (hasCheckedMountRef.current || !query.isSuccess) {
      return
    }

    hasCheckedMountRef.current = true

    if (isDue(query.data, Date.now())) {
      startRefresh()
    }
  }, [query.isSuccess, query.data, startRefresh])

  return {
    query,
    refresh: startRefresh,
    isRefreshing: mutation.isPending,
    refreshError: mutation.error,
  }
}
