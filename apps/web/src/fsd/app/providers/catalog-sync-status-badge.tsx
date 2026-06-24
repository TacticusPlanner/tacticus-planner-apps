import { Badge } from "@workspace/ui/components/badge"

import {
  useCatalogSyncStatus,
  type CatalogSyncStatus,
} from "@/entities/catalog"

const statusLabels: Record<CatalogSyncStatus, string> = {
  "auth-required": "Catalog auth",
  error: "Catalog error",
  idle: "Catalog idle",
  ready: "Catalog ready",
  stale: "Catalog stale",
  syncing: "Catalog sync",
}

export function CatalogSyncStatusBadge() {
  const { error, status } = useCatalogSyncStatus()
  const variant = status === "error" ? "destructive" : "outline"

  return (
    <Badge
      data-testid="catalog-sync-status"
      title={error ?? statusLabels[status]}
      variant={variant}
    >
      {statusLabels[status]}
    </Badge>
  )
}
