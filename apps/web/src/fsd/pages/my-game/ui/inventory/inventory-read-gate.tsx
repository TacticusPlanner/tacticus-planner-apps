import type { ReactNode } from "react"
import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Spinner } from "@workspace/ui/components/spinner"

import { usePlayerDataSyncStatus } from "@/features/player-data-sync"
import type { ReadState } from "@/shared/lib"
import { EmptyState, LocalReadFailure } from "@/shared/ui"

/**
 * What a tab shows until its synced chunk is there: a skeleton while it is read, the shared read
 * failure, or, before the first sync, "No inventory yet" with Sync now. Then `children` with the data.
 */
export function InventoryReadGate<T>({
  read,
  children,
}: {
  read: ReadState<T | null>
  children: (data: T) => ReactNode
}) {
  if (read.status === "loading") {
    return (
      <div className="flex flex-col gap-3" data-testid="inventory-loading">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (read.status === "error") return <LocalReadFailure retry={read.retry} />
  if (read.data === null) return <NoInventory />
  return <>{children(read.data)}</>
}

function NoInventory() {
  const { t } = useTranslation("inventory")
  const { isSyncing, syncDisabled, syncNow } = usePlayerDataSyncStatus()
  return (
    <EmptyState
      actions={
        <Button
          disabled={syncDisabled}
          onClick={() => syncNow()}
          variant="outline"
        >
          {isSyncing ? <Spinner aria-hidden /> : <RefreshCw aria-hidden />}
          {t("page.empty.action")}
        </Button>
      }
      description={t("page.empty.description")}
      testId="inventory-empty"
      title={t("page.empty.title")}
    />
  )
}
