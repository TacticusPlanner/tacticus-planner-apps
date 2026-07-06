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
  usePlayerDataStatus,
  type PlayerDataStatus,
} from "@/shared/player-data"

const statusIcons: Record<PlayerDataStatus, typeof CheckCircle2> = {
  idle: CircleDashed,
  syncing: RefreshCw,
  ready: CheckCircle2,
  stale: Clock,
  error: AlertTriangle,
}

// Reuses the existing manageAccount.playerData.* labels (idle/syncing/ready/stale/error) instead
// of introducing a duplicate playerData.badge.* i18n group — those keys already read fine
// standalone ("Up to date", "Sync failed", etc.), same wording the account dialog used to show.
const statusLabelKeys = {
  idle: "manageAccount.playerData.statusIdle",
  syncing: "manageAccount.playerData.statusSyncing",
  ready: "manageAccount.playerData.statusReady",
  stale: "manageAccount.playerData.statusStale",
  error: "manageAccount.playerData.statusError",
} as const satisfies Record<PlayerDataStatus, string>

/** Shows the player-data sync status, mirroring `CatalogSyncStatusBadge`'s compact/full shape.
 *  `compact` swaps the full-width badge for an icon-only rendering (with progress, e.g. "3/10",
 *  while syncing) for the collapsed sidebar. */
export function PlayerDataSyncStatusBadge({
  compact = false,
}: {
  compact?: boolean
}) {
  const { t } = useTranslation()
  const { error, progress, status } = usePlayerDataStatus()
  const label = t(statusLabelKeys[status])

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
            data-testid="player-data-sync-status-compact"
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

  const variant = status === "error" ? "destructive" : "outline"

  return (
    <Badge
      data-testid="player-data-sync-status"
      title={error ?? label}
      variant={variant}
    >
      {label}
    </Badge>
  )
}
