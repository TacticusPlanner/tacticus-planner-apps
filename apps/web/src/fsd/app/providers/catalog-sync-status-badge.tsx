import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"

import { useGameCatalogStatus } from "@/shared/game-catalog"

export function CatalogSyncStatusBadge() {
  const { t } = useTranslation()
  const { error, gameVersion, status } = useGameCatalogStatus()
  const variant = status === "error" ? "destructive" : "outline"
  const label = t(`catalog.badge.${status}`, { version: gameVersion ?? "" })

  return (
    <Badge
      data-testid="catalog-sync-status"
      title={error ?? label}
      variant={variant}
    >
      {label}
    </Badge>
  )
}
