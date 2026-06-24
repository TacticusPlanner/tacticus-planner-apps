import type { ReactNode } from "react"

import { CatalogSyncProvider } from "@/entities/catalog"

export function CatalogProvider({ children }: { children: ReactNode }) {
  return <CatalogSyncProvider>{children}</CatalogSyncProvider>
}
