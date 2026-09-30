import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  RefreshCw,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import {
  useGameCatalogStatus,
  type GameCatalogStatus,
} from "./game-catalog-provider"

const statusIcons: Record<GameCatalogStatus, typeof CheckCircle2> = {
  idle: CircleDashed,
  syncing: RefreshCw,
  ready: CheckCircle2,
  stale: Clock,
  error: AlertTriangle,
}

/** Shows the game catalog sync status. `compact` swaps the full-width badge for an icon-only
 *  rendering (with progress, e.g. "3/12", while syncing) for the collapsed sidebar. */
export function CatalogSyncStatusBadge({
  compact = false,
  plain = false,
}: {
  compact?: boolean
  /** Quiet footer-line text instead of a badge (desktop account card). */
  plain?: boolean
}) {
  const { t } = useTranslation()
  const { error, gameVersion, progress, status } = useGameCatalogStatus()
  const label = t(`catalog.badge.${status}`, { version: gameVersion ?? "" })

  if (compact) {
    const Icon = statusIcons[status]
    const progressLabel =
      status === "syncing" && progress
        ? `${progress.downloaded}/${progress.total}`
        : null

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex items-center justify-center gap-1 text-muted-foreground"
            data-testid="catalog-sync-status-compact"
          >
            <Icon
              aria-hidden="true"
              className={
                status === "syncing" ? "size-4 animate-spin" : "size-4"
              }
            />
            {progressLabel ? (
              <span className="text-[10px] tabular-nums">{progressLabel}</span>
            ) : null}
          </div>
        </TooltipTrigger>
        <TooltipContent align="center" side="right">
          {error ?? label}
        </TooltipContent>
      </Tooltip>
    )
  }

  if (plain) {
    return (
      <p
        className={
          status === "error"
            ? "px-2 text-xs text-destructive"
            : "px-2 text-xs text-muted-foreground"
        }
        data-testid="catalog-sync-status"
        title={error ?? label}
      >
        {label}
      </p>
    )
  }

  const variant = status === "error" ? "destructive" : "outline"

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
