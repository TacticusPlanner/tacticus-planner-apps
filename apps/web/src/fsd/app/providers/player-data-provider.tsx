import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"

import { useIsAuthenticated } from "@azure/msal-react"
import { useQueryClient, type QueryClient } from "@tanstack/react-query"

import {
  getManifestMetadata,
  getPlayerDataMetadata,
  type PlayerDataSyncProgress,
  type PlayerDataSyncResult,
} from "@workspace/player-data"

import { refreshServerReadsAfterSync } from "@/features/player-data-sync"
import { reportError } from "@/shared/lib"
import {
  createProgressStore,
  refreshLocalDataAfterSync,
  writtenKeys,
} from "@/shared/local-data"
import {
  acquireAccessToken,
  isInteractionRequired,
  requestInteraction,
  useActiveAccountId,
} from "@/shared/auth"
import {
  PlayerDataContext,
  PlayerDataProgressContext,
  type PlayerDataContextValue,
  type PlayerDataStatus,
} from "@/shared/player-data-status"

// A background sync is due once the last successful sync is more than an hour old — matches the
// "sync at most hourly, but always up to date within an hour" requirement. Re-checked periodically
// while the app stays open (not just on mount/account-change), so a long-lived tab still syncs.
const staleAfterMs = 60 * 60 * 1000
const staleCheckIntervalMs = 5 * 60 * 1000

const progressStore = createProgressStore<PlayerDataSyncProgress>()

async function runPlayerDataSync(
  baseUrl: string,
  queryClient: QueryClient
): Promise<PlayerDataSyncResult> {
  // Loaded on demand so the HTTP client and the zod schemas stay out of the entry bundle.
  const { PlayerDataHttpClient, syncPlayerData } =
    await import("@workspace/player-data/sync")
  progressStore.set(null)
  try {
    const result = await syncPlayerData(
      new PlayerDataHttpClient(baseUrl, acquireAccessToken),
      { onProgress: progressStore.set }
    )
    refreshLocalDataAfterSync(queryClient, "player", writtenKeys(result))
    return result
  } catch (error) {
    // A partly failed sync still stored some chunks; refresh those.
    refreshLocalDataAfterSync(queryClient, "player", writtenKeys(error))
    throw error
  }
}

/**
 * Runs a player-data sync for the account through the query client, which dedupes an in-flight run:
 * StrictMode double-mounts and the periodic staleness check firing close to a manual "sync now"
 * share one request. Every call past an in-flight one starts a fresh run (the staleness gate in the
 * provider decides when one is due).
 */
function fetchPlayerDataSync(
  queryClient: QueryClient,
  baseUrl: string,
  accountId: string
): Promise<PlayerDataSyncResult> {
  return queryClient.fetchQuery({
    queryKey: ["sync", "player", accountId],
    queryFn: () => runPlayerDataSync(baseUrl, queryClient),
    staleTime: 0,
    retry: false,
  })
}

export type PlayerDataProviderProps = {
  baseUrl: string
  children: ReactNode
}

/**
 * Non-blocking counterpart to GameCatalogProvider: player data is per-account and not required to
 * render the app shell, so this provider never gates children behind an init screen. It exposes sync
 * status via context for an optional small indicator/"Sync now" control instead.
 */
export function PlayerDataProvider({
  baseUrl,
  children,
}: PlayerDataProviderProps) {
  const isAuthenticated = useIsAuthenticated()
  const accountId = useActiveAccountId()

  const [status, setStatus] = useState<PlayerDataStatus>("idle")
  const progress = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.get
  )
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [requiresReauth, setRequiresReauth] = useState(false)
  const hasRequestedApiAccess = useRef(false)
  const queryClient = useQueryClient()

  // The account to sync for, or null while signed out.
  const syncAccountId = isAuthenticated ? accountId : null

  const runSync = useCallback(
    async (activeAccountId: string) => {
      setStatus("syncing")
      setError(null)
      setRequiresReauth(false)

      try {
        const result = await fetchPlayerDataSync(
          queryClient,
          baseUrl,
          activeAccountId
        )
        hasRequestedApiAccess.current = false
        setLastSyncedAt(result.syncedAt)
        setStatus(result.status)
        // Manual and background syncs alike: refetch the server reads the sync can change (goals,
        // Legendary Event run records and plans) now that it has finished.
        void refreshServerReadsAfterSync(queryClient)
      } catch (caught) {
        const syncError =
          caught instanceof Error ? caught : new Error(String(caught))

        console.error("Player-data sync failed.", syncError)
        setError(syncError.message)
        // Unlike the catalog, there is no "last known good, still usable" distinction to fall back to
        // here from the provider's point of view — cached chunks (if any) remain in IndexedDB regardless
        // and are read directly by feature hooks, independent of this status.
        setStatus("error")

        const requiresReauthNow = isInteractionRequired(caught)
        setRequiresReauth(requiresReauthNow)

        if (!requiresReauthNow) {
          hasRequestedApiAccess.current = false
          return
        }

        // Guarded to fire once per detected error — the periodic staleness check re-runs this
        // sync every few minutes while the account stays unauthorized, and each retry hits this
        // same catch block again without a redirect having resolved anything in between.
        if (!hasRequestedApiAccess.current) {
          hasRequestedApiAccess.current = true
          void requestInteraction().catch((redirectError: unknown) => {
            console.error(
              "[MSAL] player-data auto-reauth failed",
              redirectError
            )
          })
        }
      }
    },
    [queryClient, baseUrl]
  )

  // Auto-sync: only fires when the last successful sync is more than an hour old (or there has never
  // been one). Re-checked periodically so a long-lived tab still syncs without a reload. This effect
  // never runs a sync just because it re-ran — staleness is re-evaluated from stored metadata each time.
  useEffect(() => {
    let active = true

    async function checkAndSyncIfDue() {
      if (!syncAccountId) {
        if (active) {
          setStatus("idle")
        }
        return
      }

      const metadata = await getPlayerDataMetadata()
      const manifestMetadata = getManifestMetadata(metadata)
      const lastSynced = manifestMetadata
        ? Date.parse(manifestMetadata.updatedAt)
        : NaN
      const due =
        Number.isNaN(lastSynced) || Date.now() - lastSynced > staleAfterMs

      if (!active) {
        return
      }

      if (manifestMetadata) {
        setLastSyncedAt(manifestMetadata.updatedAt)
        setStatus("ready")
      }

      if (due) {
        await runSync(syncAccountId)
      }
    }

    // Expected sync failures are handled in runSync; this only catches what escapes (e.g. a failing
    // metadata read), so one bad check never stops the interval.
    const check = () =>
      checkAndSyncIfDue().catch((error: unknown) =>
        reportError(error, "player-data sync")
      )
    void check()

    const interval = setInterval(() => {
      void check()
    }, staleCheckIntervalMs)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [syncAccountId, runSync])

  // Manual trigger: always syncs immediately, bypassing the one-hour staleness gate above.
  const syncNow = useCallback(() => {
    if (!syncAccountId) {
      return
    }

    runSync(syncAccountId).catch((error: unknown) =>
      reportError(error, "player-data sync")
    )
  }, [syncAccountId, runSync])

  const value = useMemo<PlayerDataContextValue>(
    () => ({
      status,
      lastSyncedAt,
      error,
      requiresReauth,
      syncNow,
    }),
    [status, lastSyncedAt, error, requiresReauth, syncNow]
  )

  return (
    <PlayerDataContext.Provider value={value}>
      <PlayerDataProgressContext.Provider value={progress}>
        {children}
      </PlayerDataProgressContext.Provider>
    </PlayerDataContext.Provider>
  )
}
