import { useCatalogStatus, type CatalogStatus } from "@workspace/game-catalog"
import { Badge } from "@workspace/ui/components/badge"

const statusLabels: Record<CatalogStatus, string> = {
  error: "Catalog error",
  idle: "Catalog idle",
  ready: "Catalog ready",
  stale: "Catalog stale",
  syncing: "Catalog sync",
}

export function CatalogSyncStatusBadge() {
  const { error, status } = useCatalogStatus()
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
