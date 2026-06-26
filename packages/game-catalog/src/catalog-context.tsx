/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

import { CatalogHttpClient } from "./catalog-api"
import {
  getDatasetRecords,
  hasCompleteCatalogCache,
  type StoredRecord,
} from "./catalog-storage"
import {
  syncCatalog,
  type CatalogSyncProgress,
  type CatalogSyncResult,
} from "./catalog-sync"
import type { CatalogDatasetKey } from "./types"

// StrictMode double-invokes effects, and auth-driven route remounts can mount the provider several times
// in quick succession — without this guard each mount would issue its own manifest request (the source of
// the "manifest fetched four times on refresh" behaviour). Coalesce overlapping syncs for the same
// baseUrl into a single in-flight request; it clears once settled so a later sync still runs.
let inFlightSync: {
  baseUrl: string
  promise: Promise<CatalogSyncResult>
} | null = null

function runSharedSync(
  baseUrl: string,
  onProgress: (progress: CatalogSyncProgress) => void
): Promise<CatalogSyncResult> {
  if (inFlightSync && inFlightSync.baseUrl === baseUrl) {
    return inFlightSync.promise
  }

  const promise = syncCatalog(new CatalogHttpClient(baseUrl), {
    onProgress,
  }).finally(() => {
    if (inFlightSync?.promise === promise) {
      inFlightSync = null
    }
  })

  inFlightSync = { baseUrl, promise }

  return promise
}

export type CatalogStatus = "idle" | "syncing" | "ready" | "stale" | "error"

export type CatalogContextValue = {
  status: CatalogStatus
  progress: CatalogSyncProgress | null
  gameVersion: string | null
  firstTime: boolean
  error: string | null
  retry: () => void
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined)

export type CatalogProviderProps = {
  baseUrl: string
  children: ReactNode
}

export function CatalogProvider({ baseUrl, children }: CatalogProviderProps) {
  const [status, setStatus] = useState<CatalogStatus>("idle")
  const [progress, setProgress] = useState<CatalogSyncProgress | null>(null)
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
        const canUseStaleCache = await hasCompleteCatalogCache()

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
    <CatalogContext.Provider
      value={{ status, progress, gameVersion, firstTime, error, retry }}
    >
      {children}
    </CatalogContext.Provider>
  )
}

export function useCatalogStatus() {
  const context = useContext(CatalogContext)

  if (!context) {
    throw new Error("useCatalogStatus must be used within CatalogProvider.")
  }

  return context
}

type DatasetState<TValue> = {
  data: TValue
  loading: boolean
  error: string | null
}

function useCatalogReady() {
  return useContext(CatalogContext)?.status ?? "idle"
}

/** Loads all records for a dataset from IndexedDB, refreshing when the catalog becomes ready. */
export function useDatasetRecords<K extends CatalogDatasetKey>(datasetKey: K) {
  const status = useCatalogReady()
  const [state, setState] = useState<DatasetState<StoredRecord<K>[]>>({
    data: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    void getDatasetRecords(datasetKey)
      .then((records) => {
        if (!cancelled) {
          setState({ data: records, loading: false, error: null })
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setState({
            data: [],
            loading: false,
            error: caught instanceof Error ? caught.message : String(caught),
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [datasetKey, status])

  return state
}
