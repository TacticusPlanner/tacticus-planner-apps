import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  LoaderCircle,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

import { useGameCatalogStatus } from "@/shared/game-catalog"

export function CatalogSyncStatusBadge({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { error, gameVersion, progress, status } = useGameCatalogStatus()
  const variant = status === "error" ? "destructive" : "outline"
  const label = t(`catalog.badge.${status}`, { version: gameVersion ?? "" })
  const progressLabel =
    progress && progress.total > 0
      ? t("catalog.badge.progress", {
          done: progress.downloaded,
          total: progress.total,
        })
      : null
  const title = error ?? [label, progressLabel].filter(Boolean).join(" ")
  const StatusIcon =
    status === "syncing"
      ? LoaderCircle
      : status === "error" || status === "stale"
        ? AlertTriangle
        : status === "ready"
          ? CheckCircle2
          : Database

  return (
    <div className={cn("min-w-0", className)} data-testid="catalog-sync-status">
      <Badge
        className="max-w-full group-data-[collapsible=icon]:hidden"
        title={title}
        variant={variant}
      >
        <StatusIcon
          className={cn("size-3", status === "syncing" && "animate-spin")}
          aria-hidden="true"
        />
        <span className="truncate">
          {label}
          {progressLabel ? ` ${progressLabel}` : ""}
        </span>
      </Badge>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            aria-label={title}
            className="hidden min-h-10 w-8 flex-col justify-center gap-0 px-0 text-[10px] leading-none group-data-[collapsible=icon]:inline-flex"
            data-testid="catalog-sync-status-compact"
            title={title}
            variant={variant}
          >
            <StatusIcon
              className={cn("size-3.5", status === "syncing" && "animate-spin")}
              aria-hidden="true"
            />
            {progressLabel ? (
              <span aria-hidden="true">
                {progress?.downloaded}/{progress?.total}
              </span>
            ) : null}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right">{title}</TooltipContent>
      </Tooltip>
    </div>
  )
}
