/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { CatalogHttpClient } from "./catalog-api"
import {
  getDatasetExtras,
  getDatasetRecords,
  hasCompleteCatalogCache,
  searchDataset,
  type CatalogExtrasByKey,
  type StoredRecord,
} from "./catalog-storage"
import { syncCatalog, type CatalogSyncProgress } from "./catalog-sync"
import type { CatalogDatasetKey } from "./types"

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
  const runningRef = useRef(false)

  useEffect(() => {
    if (runningRef.current) {
      return
    }

    runningRef.current = true
    let cancelled = false

    async function runSync() {
      setStatus("syncing")
      setError(null)
      setProgress(null)

      try {
        const result = await syncCatalog(new CatalogHttpClient(baseUrl), {
          onProgress: (value) => {
            if (!cancelled) {
              setProgress(value)
            }
          },
        })

        if (cancelled) {
          return
        }

        setGameVersion(result.gameVersion || null)
        setFirstTime(result.firstTime)
        setStatus(result.status)
      } catch (caught) {
        const canUseStaleCache = await hasCompleteCatalogCache()

        if (cancelled) {
          return
        }

        setError(caught instanceof Error ? caught.message : String(caught))
        setStatus(canUseStaleCache ? "stale" : "error")
      } finally {
        runningRef.current = false
      }
    }

    void runSync()

    return () => {
      cancelled = true
    }
  }, [baseUrl, attempt])

  const retry = useCallback(() => {
    if (!runningRef.current) {
      setAttempt((value) => value + 1)
    }
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

/** Searches a dataset's `searchText` index (substring match), refreshing when the catalog is ready. */
export function useDatasetSearch<K extends CatalogDatasetKey>(
  datasetKey: K,
  term: string
) {
  const status = useCatalogReady()
  const [state, setState] = useState<DatasetState<StoredRecord<K>[]>>({
    data: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    void searchDataset(datasetKey, term)
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
  }, [datasetKey, term, status])

  return state
}

/** Loads a dataset's shared tables (e.g. mow/equipment cost ladders) from IndexedDB. */
export function useDatasetExtras<K extends CatalogDatasetKey>(datasetKey: K) {
  const status = useCatalogReady()
  const [state, setState] = useState<
    DatasetState<CatalogExtrasByKey[K] | undefined>
  >({
    data: undefined,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    void getDatasetExtras(datasetKey)
      .then((extras) => {
        if (!cancelled) {
          setState({ data: extras, loading: false, error: null })
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setState({
            data: undefined,
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
