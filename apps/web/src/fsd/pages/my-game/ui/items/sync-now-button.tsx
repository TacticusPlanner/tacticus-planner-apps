import { useTranslation } from "react-i18next"
import { RefreshCw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"

import { usePlayerDataSyncStatus } from "@/features/player-data-sync"

/** "Sync now", the one action that fills an Items page that has nothing to show yet. */
export function SyncNowButton() {
  const { t } = useTranslation("myItems")
  const { isSyncing, syncDisabled, syncNow } = usePlayerDataSyncStatus()
  return (
    <Button disabled={syncDisabled} onClick={() => syncNow()} variant="outline">
      {isSyncing ? (
        <Spinner aria-hidden="true" />
      ) : (
        <RefreshCw aria-hidden="true" />
      )}
      {t("empty.sync")}
    </Button>
  )
}
