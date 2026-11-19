import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import type { ReactNode } from "react"

import { useQueryClient } from "@tanstack/react-query"
import type { QueryClient } from "@tanstack/react-query"
import { hasCompleteGameCatalogCache } from "@workspace/game-catalog"
import type {
  GameCatalogSyncProgress,
  GameCatalogSyncResult,
} from "@workspace/game-catalog"

import { GameCatalogContext } from "@/shared/game-catalog-status"
import type { GameCatalogStatus } from "@/shared/game-catalog-status"
import { reportError } from "@/shared/lib"
import {
  createProgressStore,
  listenForLocalDataRefresh,
  refreshLocalDataAfterSync,
  writtenKeys,
} from "@/shared/local-data"

const progressStore = createProgressStore<GameCatalogSyncProgress>()

async function runCatalogSync(
  baseUrl: string,
  queryClient: QueryClient
): Promise<GameCatalogSyncResult> {
  // Loaded on demand so the HTTP client and the zod schemas stay out of the entry bundle.
  const { GameCatalogHttpClient, syncGameCatalog } =
    await import("@workspace/game-catalog/sync")
  progressStore.set(null)
  try {
    const result = await syncGameCatalog(new GameCatalogHttpClient(baseUrl), {
      onProgress: progressStore.set,
    })
    refreshLocalDataAfterSync(queryClient, "catalog", writtenKeys(result))
    return result
  } catch (error) {
    // A partly failed sync still stored some datasets; refresh those.
    refreshLocalDataAfterSync(queryClient, "catalog", writtenKeys(error))
    throw error
  }
}

/**
 * One catalog sync per session, shared through the query client: StrictMode double effects and
 * auth-driven remounts reuse the in-flight (or finished) run instead of each requesting the
 * manifest. `force` (Retry) runs it again, still deduping a run already in flight.
 */
function fetchCatalogSync(
  queryClient: QueryClient,
  baseUrl: string,
  force: boolean
): Promise<GameCatalogSyncResult> {
  // eslint-disable-next-line @tanstack/query/exhaustive-deps -- the client is the cache, not an input
  return queryClient.query({
    queryKey: ["sync", "catalog", baseUrl],
    queryFn: () => runCatalogSync(baseUrl, queryClient),
    staleTime: force ? 0 : Infinity,
    gcTime: Infinity,
    retry: false,
  })
}

export type GameCatalogProviderProps = {
  baseUrl: string
  children: ReactNode
}

export function GameCatalogProvider({
  baseUrl,
  children,
}: GameCatalogProviderProps) {
  const [status, setStatus] = useState<GameCatalogStatus>("idle")
  const progress = useSyncExternalStore(
    progressStore.subscribe,
    progressStore.get
  )
  const queryClient = useQueryClient()
  const [gameVersion, setGameVersion] = useState<string | null>(null)
  const [firstTime, setFirstTime] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  // Other tabs post the datasets their syncs wrote; refresh those here too.
  useEffect(() => listenForLocalDataRefresh(queryClient), [queryClient])

  useEffect(() => {
    // Each run owns its own `active` flag; a superseded run (StrictMode remount, baseUrl/attempt change)
    // bails before touching state, while the live run always lands its result — so the init gate can
    // never get wedged on "syncing". The underlying sync is shared through the query client so
    // overlapping mounts don't each hit the network.
    let active = true

    async function runSync() {
      setStatus("syncing")
      setError(null)

      // Settled without `try`: React Compiler can't lower the conditionals below inside one.
      const outcome = await fetchCatalogSync(
        queryClient,
        baseUrl,
        attempt > 0
      ).then(
        (result) => ({ ok: true as const, result }),
        (caught: unknown) => ({ ok: false as const, caught })
      )

      if (outcome.ok) {
        if (!active) return
        setGameVersion(outcome.result.gameVersion || null)
        setFirstTime(outcome.result.firstTime)
        setStatus(outcome.result.status)
        return
      }

      const canUseStaleCache = await hasCompleteGameCatalogCache()
      if (!active) return
      const { caught } = outcome
      setError(caught instanceof Error ? caught.message : String(caught))
      setStatus(canUseStaleCache ? "stale" : "error")
    }

    // Expected failures are handled inside; this only catches what escapes (e.g. a failing cache read).
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-external-store-subscription -- a cancellable catalog sync, not a store subscription
    runSync().catch((error: unknown) => reportError(error, "catalog sync"))

    return () => {
      active = false
    }
  }, [baseUrl, attempt, queryClient])

  const retry = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])

  return (
    <GameCatalogContext.Provider
      value={{ status, progress, gameVersion, firstTime, error, retry }}
    >
      {children}
    </GameCatalogContext.Provider>
  )
}
