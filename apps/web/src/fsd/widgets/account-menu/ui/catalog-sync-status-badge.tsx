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
import { Spinner } from "@workspace/ui/components/spinner"

import { useGameCatalogStatus } from "@/shared/game-catalog-status"
import { HintTrigger } from "@/shared/ui"
import type { GameCatalogStatus } from "@/shared/game-catalog-status"

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
            aria-label={error ?? label}
            className="flex items-center justify-center gap-1 text-muted-foreground"
            data-testid="catalog-sync-status-compact"
            role="status"
          >
            {status === "syncing" ? (
              <Spinner aria-hidden="true" />
            ) : (
              <Icon aria-hidden="true" className="size-icon" />
            )}
            {progressLabel ? (
              <span className="text-xs tabular-nums">{progressLabel}</span>
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
      >
        {error ? (
          <HintTrigger hint={error} label={label}>
            {label}
          </HintTrigger>
        ) : (
          label
        )}
      </p>
    )
  }

  const variant = status === "error" ? "destructive" : "outline"

  return (
    <Badge data-testid="catalog-sync-status" variant={variant}>
      {error ? (
        <HintTrigger hint={error} label={label}>
          {label}
        </HintTrigger>
      ) : (
        label
      )}
    </Badge>
  )
}
