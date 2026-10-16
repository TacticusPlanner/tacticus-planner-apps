import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { formatRelativeTime } from "@/shared/lib"
import {
  usePlayerDataStatus,
  type PlayerDataStatus,
} from "@/shared/player-data-status"

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
 * sidebar button and mobile bottom-nav action in `app`, the quick action, and a page's own "sync to
 * see this" prompt such as My Game Collection's) — one source of truth for "what does the current
 * status say, and should the control be disabled right now" so the presentations can't drift apart.
 */
export function usePlayerDataSyncStatus() {
  const { i18n, t } = useTranslation()
  const { error, lastSyncedAt, progress, requiresReauth, status, syncNow } =
    usePlayerDataStatus()
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
    // The provider refreshes the server reads once the sync completes (refreshServerReadsAfterSync).
    syncNow,
  }
}
