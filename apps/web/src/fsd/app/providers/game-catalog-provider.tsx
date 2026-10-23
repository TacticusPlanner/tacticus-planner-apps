/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"

import { useQueryClient, type QueryClient } from "@tanstack/react-query"
import {
  hasCompleteGameCatalogCache,
  type GameCatalogSyncProgress,
  type GameCatalogSyncResult,
} from "@workspace/game-catalog"

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
  return queryClient.fetchQuery({
    queryKey: ["sync", "catalog", baseUrl],
    queryFn: () => runCatalogSync(baseUrl, queryClient),
    staleTime: force ? 0 : Infinity,
    gcTime: Infinity,
    retry: false,
  })
}

export type GameCatalogStatus = "idle" | "syncing" | "ready" | "stale" | "error"

export type GameCatalogContextValue = {
  status: GameCatalogStatus
  progress: GameCatalogSyncProgress | null
  gameVersion: string | null
  firstTime: boolean
  error: string | null
  retry: () => void
}

const GameCatalogContext = createContext<GameCatalogContextValue | undefined>(
  undefined
)

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

      try {
        const result = await fetchCatalogSync(queryClient, baseUrl, attempt > 0)

        if (!active) {
          return
        }

        setGameVersion(result.gameVersion || null)
        setFirstTime(result.firstTime)
        setStatus(result.status)
      } catch (caught) {
        const canUseStaleCache = await hasCompleteGameCatalogCache()

        if (!active) {
          return
        }

        setError(caught instanceof Error ? caught.message : String(caught))
        setStatus(canUseStaleCache ? "stale" : "error")
      }
    }

    // Expected failures are handled inside; this only catches what escapes (e.g. a failing cache read).
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

export function useGameCatalogStatus() {
  const context = useContext(GameCatalogContext)

  if (!context) {
    throw new Error(
      "useGameCatalogStatus must be used within GameCatalogProvider."
    )
  }

  return context
}
