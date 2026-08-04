/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  LogIn,
  RefreshCw,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { CommandShortcut } from "@workspace/ui/components/command"
import { SidebarMenuButton } from "@workspace/ui/components/sidebar"
import { cn } from "@workspace/ui/lib/utils"

import { isMacPlatform } from "@/app/layout/is-mac-platform"
import { formatRelativeTime } from "@/shared/lib"
import { goalQueries } from "@/entities/goal"

import {
  usePlayerDataStatus,
  type PlayerDataStatus,
} from "./player-data-provider"

const statusIcons: Record<PlayerDataStatus, typeof CheckCircle2> = {
  idle: CircleDashed,
  syncing: RefreshCw,
  ready: CheckCircle2,
  stale: Clock,
  error: AlertTriangle,
}

// Reuses the existing manageAccount.playerData.* labels (idle/syncing/ready/stale/error) instead of
// introducing a duplicate i18n group — those keys already read fine standalone ("Up to date", "Sync
// failed", etc.), the same wording the old standalone status badge showed.
const statusLabelKeys = {
  idle: "manageAccount.playerData.statusIdle",
  syncing: "manageAccount.playerData.statusSyncing",
  ready: "manageAccount.playerData.statusReady",
  stale: "manageAccount.playerData.statusStale",
  error: "manageAccount.playerData.statusError",
} as const satisfies Record<PlayerDataStatus, string>

const relativeTimeRefreshMs = 30 * 1000

/**
 * The status text/disabled-state logic shared by every "Sync with Tacticus" control (the desktop
 * sidebar button below, and the mobile bottom-nav action button) — one source of truth for "what does
 * the current status say, and should the control be disabled right now" so the two presentations
 * can't drift out of sync with each other.
 */
export function usePlayerDataSyncStatus() {
  const { i18n, t } = useTranslation()
  const { error, lastSyncedAt, progress, requiresReauth, status, syncNow } =
    usePlayerDataStatus()
  const queryClient = useQueryClient()
  const syncAndRefreshGoals = async () => {
    await syncNow()
    await queryClient.invalidateQueries({ queryKey: goalQueries.all() })
  }
  const [, setRelativeTimeTick] = useState(() => Date.now())
  const isSyncing = status === "syncing"
  const statusLabel = t(statusLabelKeys[status])
  const relativeLastSync = lastSyncedAt
    ? formatRelativeTime(Date.parse(lastSyncedAt), i18n.language)
    : null
  const lastSyncText = relativeLastSync
    ? t("manageAccount.playerData.lastSynced", { time: relativeLastSync })
    : t("manageAccount.playerData.neverSynced")
  const progressText = progress
    ? t("manageAccount.playerData.syncProgress", {
        downloaded: progress.downloaded,
        total: progress.total,
      })
    : statusLabel
  const statusText =
    status === "syncing"
      ? progressText
      : status === "error"
        ? requiresReauth
          ? t("manageAccount.playerData.reauthRequired")
          : (error ?? t("manageAccount.playerData.retrySync"))
        : status === "stale"
          ? t("manageAccount.playerData.refreshRequired", {
              lastSync: lastSyncText,
            })
          : lastSyncText

  useEffect(() => {
    if (!lastSyncedAt) {
      return
    }

    const interval = window.setInterval(
      () => setRelativeTimeTick(Date.now()),
      relativeTimeRefreshMs
    )

    return () => window.clearInterval(interval)
  }, [lastSyncedAt])

  return {
    status,
    isSyncing,
    lastSyncedAt,
    lastSyncText,
    statusText,
    errorText: error,
    requiresReauth,
    syncNow: syncAndRefreshGoals,
  }
}

const statusClasses: Record<PlayerDataStatus, string> = {
  idle: "text-muted-foreground",
  syncing: "bg-accent/10 text-accent hover:bg-accent/15 hover:text-accent",
  ready: "bg-accent/10 text-accent hover:bg-accent/15 hover:text-accent",
  stale:
    "bg-accent/15 text-accent-foreground ring-1 ring-inset ring-accent/40 hover:bg-accent/25 hover:text-accent-foreground",
  error:
    "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/25 hover:bg-destructive/15 hover:text-destructive",
}

/**
 * The sidebar's single "Sync with Tacticus" control — combines what used to be a separate action
 * button and a read-only status badge into one clickable element, per feedback that splitting an
 * action and its own status across two places was confusing. The icon reflects the current status
 * (mirroring the old badge's icon-per-status mapping) and spins while a sync is in flight; the button
 * disables itself for the same duration so a click can't queue a second overlapping sync; the tooltip
 * carries the same status text (plus progress and any error) the old badge showed.
 */
export function PlayerDataSyncButton() {
  const { t } = useTranslation()
  const { errorText, isSyncing, requiresReauth, status, statusText, syncNow } =
    usePlayerDataSyncStatus()
  const Icon =
    status === "error" && requiresReauth ? LogIn : statusIcons[status]
  // A raw MSAL/network error message isn't actionable for the user — once it's a sign-in issue, the
  // friendly statusText ("Sign-in expired…") replaces it instead of surfacing errorText verbatim.
  const tooltip = `${t("nav.syncWithTacticus")} — ${requiresReauth ? statusText : (errorText ?? statusText)}`
  const shortcutHint = isMacPlatform() ? "⌘⇧S" : "Ctrl+Shift+S"

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "s"
      ) {
        event.preventDefault()
        if (!isSyncing) syncNow()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isSyncing, syncNow])

  return (
    <SidebarMenuButton
      className={cn("mt-2 h-auto min-h-12", statusClasses[status])}
      data-testid="player-data-sync-button"
      onClick={syncNow}
      disabled={isSyncing}
      size="lg"
      tooltip={tooltip}
    >
      <span className="relative flex shrink-0 items-center justify-center">
        <Icon
          aria-hidden="true"
          className={isSyncing ? "motion-safe:animate-spin" : undefined}
        />
        {status === "stale" ? (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 size-2 rounded-full bg-accent motion-safe:animate-pulse"
          />
        ) : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 group-data-[collapsible=icon]:hidden">
        <span className="flex w-full min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold">
            {t("nav.syncWithTacticus")}
          </span>
          <CommandShortcut className="text-current opacity-80">
            {shortcutHint}
          </CommandShortcut>
        </span>
        <span className="truncate text-xs font-normal opacity-80">
          {statusText}
        </span>
      </span>
    </SidebarMenuButton>
  )
}
