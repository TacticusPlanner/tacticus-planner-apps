/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { useIsAuthenticated, useMsal } from "@azure/msal-react"

import {
  PlayerDataHttpClient,
  getManifestMetadata,
  getPlayerDataMetadata,
  syncPlayerData,
  type PlayerDataSyncProgress,
  type PlayerDataSyncResult,
} from "@workspace/player-data"

import { acquireAccessToken } from "@/shared/auth"

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

export type PlayerDataStatus = "idle" | "syncing" | "ready" | "stale" | "error"

export type PlayerDataContextValue = {
  status: PlayerDataStatus
  progress: PlayerDataSyncProgress | null
  lastSyncedAt: string | null
  error: string | null
  syncNow: () => void
}

const PlayerDataContext = createContext<PlayerDataContextValue | undefined>(
  undefined
)

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
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const accountId = (instance.getActiveAccount() ?? accounts[0])?.homeAccountId

  const [status, setStatus] = useState<PlayerDataStatus>("idle")
  const [progress, setProgress] = useState<PlayerDataSyncProgress | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const client = useMemo(() => {
    if (!isAuthenticated || !accountId) {
      return null
    }

    const account = instance.getActiveAccount() ?? accounts[0]
    if (!account) {
      return null
    }

    return new PlayerDataHttpClient(baseUrl, acquireAccessToken)
  }, [baseUrl, isAuthenticated, accountId, instance, accounts])

  const runSync = useCallback(
    async (activeClient: PlayerDataHttpClient, activeAccountId: string) => {
      setStatus("syncing")
      setError(null)
      setProgress(null)

      try {
        const result = await runSharedSync(
          activeAccountId,
          activeClient,
          setProgress
        )
        setLastSyncedAt(result.syncedAt)
        setStatus(result.status)
      } catch (caught) {
        const syncError =
          caught instanceof Error ? caught : new Error(String(caught))

        console.error("Player-data sync failed.", syncError)
        setError(syncError.message)
        // Unlike the catalog, there is no "last known good, still usable" distinction to fall back to
        // here from the provider's point of view — cached chunks (if any) remain in IndexedDB regardless
        // and are read directly by feature hooks, independent of this status.
        setStatus("error")
      }
    },
    []
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

    void checkAndSyncIfDue()

    const interval = setInterval(() => {
      void checkAndSyncIfDue()
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

    void runSync(client, accountId)
  }, [client, accountId, runSync])

  const value = useMemo<PlayerDataContextValue>(
    () => ({ status, progress, lastSyncedAt, error, syncNow }),
    [status, progress, lastSyncedAt, error, syncNow]
  )

  return (
    <PlayerDataContext.Provider value={value}>
      {children}
    </PlayerDataContext.Provider>
  )
}

export function usePlayerDataStatus() {
  const context = useContext(PlayerDataContext)

  if (!context) {
    throw new Error(
      "usePlayerDataStatus must be used within PlayerDataProvider."
    )
  }

  return context
}
