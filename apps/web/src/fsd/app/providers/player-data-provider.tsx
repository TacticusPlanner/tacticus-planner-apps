import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { useIsAuthenticated } from "@azure/msal-react"
import { useQueryClient } from "@tanstack/react-query"

import {
  PlayerDataHttpClient,
  getManifestMetadata,
  getPlayerDataMetadata,
  syncPlayerData,
  type PlayerDataSyncProgress,
  type PlayerDataSyncResult,
} from "@workspace/player-data"

import { refreshServerReadsAfterSync } from "@/features/player-data-sync"
import { reportError } from "@/shared/lib"
import {
  acquireAccessToken,
  isInteractionRequired,
  requestInteraction,
  useActiveAccountId,
} from "@/shared/auth"
import {
  PlayerDataContext,
  type PlayerDataContextValue,
  type PlayerDataStatus,
} from "@/shared/player-data-status"

// A background sync is due once the last successful sync is more than an hour old — matches the
// "sync at most hourly, but always up to date within an hour" requirement. Re-checked periodically
// while the app stays open (not just on mount/account-change), so a long-lived tab still syncs.
const staleAfterMs = 60 * 60 * 1000
const staleCheckIntervalMs = 5 * 60 * 1000

// Coalesces overlapping syncs for the same account into a single in-flight request, the same way
// @workspace/game-catalog's provider does — StrictMode double-mounts and the periodic staleness
// check firing close to a manual "sync now" click would otherwise both hit the network.
let inFlightSync: {
  accountId: string
  promise: Promise<PlayerDataSyncResult>
} | null = null

function runSharedSync(
  accountId: string,
  client: PlayerDataHttpClient,
  onProgress: (progress: PlayerDataSyncProgress) => void
): Promise<PlayerDataSyncResult> {
  if (inFlightSync && inFlightSync.accountId === accountId) {
    return inFlightSync.promise
  }

  const promise = syncPlayerData(client, { onProgress }).finally(() => {
    if (inFlightSync?.promise === promise) {
      inFlightSync = null
    }
  })

  inFlightSync = { accountId, promise }

  return promise
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
  const [progress, setProgress] = useState<PlayerDataSyncProgress | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [requiresReauth, setRequiresReauth] = useState(false)
  const hasRequestedApiAccess = useRef(false)
  const queryClient = useQueryClient()

  const client = useMemo(() => {
    if (!isAuthenticated || !accountId) {
      return null
    }

    return new PlayerDataHttpClient(baseUrl, acquireAccessToken)
  }, [baseUrl, isAuthenticated, accountId])

  const runSync = useCallback(
    async (activeClient: PlayerDataHttpClient, activeAccountId: string) => {
      setStatus("syncing")
      setError(null)
      setRequiresReauth(false)
      setProgress(null)

      try {
        const result = await runSharedSync(
          activeAccountId,
          activeClient,
          setProgress
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
    [queryClient]
  )

  // Auto-sync: only fires when the last successful sync is more than an hour old (or there has never
  // been one). Re-checked periodically so a long-lived tab still syncs without a reload. This effect
  // never runs a sync just because it re-ran — staleness is re-evaluated from stored metadata each time.
  useEffect(() => {
    let active = true

    async function checkAndSyncIfDue() {
      if (!client || !accountId) {
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
        await runSync(client, accountId)
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
  }, [client, accountId, runSync])

  // Manual trigger: always syncs immediately, bypassing the one-hour staleness gate above.
  const syncNow = useCallback(() => {
    if (!client || !accountId) {
      return
    }

    runSync(client, accountId).catch((error: unknown) =>
      reportError(error, "player-data sync")
    )
  }, [client, accountId, runSync])

  const value = useMemo<PlayerDataContextValue>(
    () => ({
      status,
      progress,
      lastSyncedAt,
      error,
      requiresReauth,
      syncNow,
    }),
    [status, progress, lastSyncedAt, error, requiresReauth, syncNow]
  )

  return (
    <PlayerDataContext.Provider value={value}>
      {children}
    </PlayerDataContext.Provider>
  )
}
