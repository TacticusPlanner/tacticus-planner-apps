/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { InteractionStatus } from "@azure/msal-browser"
import { useMsal } from "@azure/msal-react"

import { CatalogHttpClient } from "./catalog-api"
import { hasCompleteCatalogCache } from "./catalog-storage"
import { syncCatalog } from "./catalog-sync"

export type CatalogSyncStatus =
  | "auth-required"
  | "error"
  | "idle"
  | "ready"
  | "stale"
  | "syncing"

type CatalogSyncContextValue = {
  error: string | null
  status: CatalogSyncStatus
}

const CatalogSyncContext = createContext<CatalogSyncContextValue | undefined>(
  undefined
)

export function CatalogSyncProvider({ children }: { children: ReactNode }) {
  const { accounts, inProgress, instance } = useMsal()
  const [value, setValue] = useState<CatalogSyncContextValue>({
    error: null,
    status: "idle",
  })
  const account = instance.getActiveAccount() ?? accounts[0]

  useEffect(() => {
    if (inProgress !== InteractionStatus.None) {
      return
    }

    if (!account) {
      return
    }

    let isCancelled = false

    async function runSync() {
      setValue({ error: null, status: "syncing" })

      try {
        const result = await syncCatalog(new CatalogHttpClient(instance))

        if (!isCancelled) {
          setValue({ error: null, status: result.status })
        }
      } catch (error) {
        const canUseStaleCache = await hasCompleteCatalogCache()

        if (!isCancelled) {
          setValue({
            error: error instanceof Error ? error.message : String(error),
            status: canUseStaleCache ? "stale" : "error",
          })
        }
      }
    }

    void runSync()

    return () => {
      isCancelled = true
    }
  }, [account, inProgress, instance])

  const contextValue = useMemo(() => {
    if (inProgress === InteractionStatus.None && !account) {
      return { error: null, status: "auth-required" as const }
    }

    return value
  }, [account, inProgress, value])

  return (
    <CatalogSyncContext.Provider value={contextValue}>
      {children}
    </CatalogSyncContext.Provider>
  )
}

export function useCatalogSyncStatus() {
  const context = useContext(CatalogSyncContext)

  if (!context) {
    throw new Error(
      "useCatalogSyncStatus must be used within CatalogSyncProvider."
    )
  }

  return context
}
