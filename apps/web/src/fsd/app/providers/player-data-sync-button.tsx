/* eslint-disable react-refresh/only-export-components */
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  RefreshCw,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { SidebarMenuButton } from "@workspace/ui/components/sidebar"

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

/**
 * The status text/disabled-state logic shared by every "Sync with Tacticus" control (the desktop
 * sidebar button below, and the mobile bottom-nav action button) — one source of truth for "what does
 * the current status say, and should the control be disabled right now" so the two presentations
 * can't drift out of sync with each other.
 */
export function usePlayerDataSyncStatus() {
  const { t } = useTranslation()
  const { error, progress, status, syncNow } = usePlayerDataStatus()
  const isSyncing = status === "syncing"
  const statusLabel = t(statusLabelKeys[status])
  const progressLabel =
    isSyncing && progress ? ` (${progress.downloaded}/${progress.total})` : ""

  return {
    status,
    isSyncing,
    statusText: `${error ?? statusLabel}${progressLabel}`,
    syncNow,
  }
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
  const { isSyncing, status, statusText, syncNow } = usePlayerDataSyncStatus()
  const Icon = statusIcons[status]
  const tooltip = `${t("nav.syncWithTacticus")} — ${statusText}`

  return (
    <SidebarMenuButton
      data-testid="player-data-sync-button"
      onClick={syncNow}
      disabled={isSyncing}
      tooltip={tooltip}
    >
      <Icon
        aria-hidden="true"
        className={isSyncing ? "animate-spin" : undefined}
      />
      <span>{t("nav.syncWithTacticus")}</span>
    </SidebarMenuButton>
  )
}
