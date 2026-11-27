import { useTranslation } from "react-i18next"
import { RefreshCw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

import { usePlayerDataSyncStatus } from "@/features/player-data-sync"

/** "Sync now", the one action that fills an Items page that has nothing to show yet. */
export function SyncNowButton() {
  const { t } = useTranslation("myItems")
  const { isSyncing, syncDisabled, syncNow } = usePlayerDataSyncStatus()
  return (
    <Button disabled={syncDisabled} onClick={() => syncNow()} variant="outline">
      <RefreshCw
        aria-hidden="true"
        className={isSyncing ? "motion-safe:animate-spin" : undefined}
      />
      {t("empty.sync")}
    </Button>
  )
}
