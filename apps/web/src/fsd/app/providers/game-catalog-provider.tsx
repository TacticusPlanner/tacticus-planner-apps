/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

import {
  GameCatalogHttpClient,
  hasCompleteGameCatalogCache,
  syncGameCatalog,
  type GameCatalogSyncProgress,
  type GameCatalogSyncResult,
} from "@workspace/game-catalog"

// StrictMode double-invokes effects, and auth-driven route remounts can mount the provider several times
// in quick succession — without this guard each mount would issue its own manifest request (the source of
// the "manifest fetched four times on refresh" behaviour). Coalesce overlapping syncs for the same
// baseUrl into a single in-flight request; it clears once settled so a later sync still runs. Matches
// @workspace/player-data's PlayerDataProvider, which has the same guard.
let inFlightSync: {
  baseUrl: string
  promise: Promise<GameCatalogSyncResult>
} | null = null

function runSharedSync(
  baseUrl: string,
  onProgress: (progress: GameCatalogSyncProgress) => void
): Promise<GameCatalogSyncResult> {
  if (inFlightSync && inFlightSync.baseUrl === baseUrl) {
    return inFlightSync.promise
  }

  const promise = syncGameCatalog(new GameCatalogHttpClient(baseUrl), {
    onProgress,
  }).finally(() => {
    if (inFlightSync?.promise === promise) {
      inFlightSync = null
    }
  })

  inFlightSync = { baseUrl, promise }

  return promise
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
  const [progress, setProgress] = useState<GameCatalogSyncProgress | null>(null)
  const [gameVersion, setGameVersion] = useState<string | null>(null)
  const [firstTime, setFirstTime] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    // Each run owns its own `active` flag; a superseded run (StrictMode remount, baseUrl/attempt change)
    // bails before touching state, while the live run always lands its result — so the init gate can
    // never get wedged on "syncing". The underlying sync is shared via runSharedSync so overlapping mounts
    // don't each hit the network.
    let active = true

    async function runSync() {
      setStatus("syncing")
      setError(null)
      setProgress(null)

      try {
        const result = await runSharedSync(baseUrl, (value) => {
          if (active) {
            setProgress(value)
          }
        })

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

    void runSync()

    return () => {
      active = false
    }
  }, [baseUrl, attempt])

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
