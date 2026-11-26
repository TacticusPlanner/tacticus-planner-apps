import { Outlet, useLocation, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { RefreshCw } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Tabs } from "@workspace/ui/components/tabs"

import { usePlayerDataSyncStatus } from "@/features/player-data-sync"
import { formatRelativeTime, useNow } from "@/shared/lib"
import { usePlayerDataStatus } from "@/shared/player-data-status"
import {
  EmptyState,
  LocalReadFailure,
  PageTabsList,
  PageTabsTrigger,
} from "@/shared/ui"

import { useMyItemsData } from "../../model/items/use-my-items-data"
import { ITEMS_PATH, ITEMS_TABS, isItemsTab } from "./items-outlet"
import type { ItemsOutlet } from "./items-outlet"
import { useItemsTutorial } from "./my-items.tutorial"

/** "Synced 12 min ago", under the tabs: everything on the page comes from the last sync. */
function SyncNote() {
  const { t, i18n } = useTranslation("myItems")
  const { lastSyncedAt } = usePlayerDataStatus()
  const now = useNow(60_000)
  const relativeLastSync = lastSyncedAt
    ? formatRelativeTime(Date.parse(lastSyncedAt), i18n.language, now)
    : null
  return (
    <p className="text-xs text-muted-foreground" data-testid="items-synced">
      {relativeLastSync
        ? t("page.synced", { time: relativeLastSync })
        : t("page.notSynced")}
    </p>
  )
}

/** Before the first sync: nothing to show, and the one action that fills the page. */
function NotSyncedState() {
  const { t } = useTranslation("myItems")
  const { isSyncing, syncDisabled, syncNow } = usePlayerDataSyncStatus()
  return (
    <EmptyState
      actions={
        <Button
          disabled={syncDisabled}
          onClick={() => syncNow()}
          variant="outline"
        >
          <RefreshCw
            aria-hidden="true"
            className={isSyncing ? "motion-safe:animate-spin" : undefined}
          />
          {t("empty.sync")}
        </Button>
      }
      description={t("empty.description")}
      testId="items-not-synced"
      title={t("empty.title")}
    />
  )
}

/**
 * My game > Items: the player's equipment, from their last sync. Three tabs, each its own route with
 * its own toolbar: Pieces (every item held or worn), Suggestions (what to equip with items already
 * held) and Reclaim (spares safe to turn into salvage). The synced data is read and joined once here
 * and handed to the tabs through the outlet.
 */
export function ItemsPage() {
  const { t } = useTranslation(["myItems", "gameUi"])
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const segment = pathname.slice(ITEMS_PATH.length + 1).split("/", 1)[0]
  const tab = isItemsTab(segment) ? segment : "pieces"
  const data = useMyItemsData()
  useItemsTutorial({ tab, ready: data.status === "ready" })

  return (
    <div className="flex flex-col gap-4" data-testid="items-page">
      <div className="flex flex-col gap-1">
        <Tabs
          onValueChange={(next) => {
            if (isItemsTab(next)) void navigate(`${ITEMS_PATH}/${next}`)
          }}
          value={tab}
        >
          <PageTabsList aria-label={t("page.tabsLabel")}>
            {ITEMS_TABS.map((value) => (
              <PageTabsTrigger
                data-testid={`items-tab-${value}`}
                key={value}
                value={value}
              >
                {t(`tabs.${value}`)}
              </PageTabsTrigger>
            ))}
          </PageTabsList>
        </Tabs>
        <SyncNote />
      </div>
      {data.status === "loading" ? (
        <div className="flex flex-col gap-3" data-testid="items-loading">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : data.status === "error" ? (
        <LocalReadFailure retry={data.retry} />
      ) : data.status === "not-synced" ? (
        <NotSyncedState />
      ) : (
        <Outlet
          context={
            {
              owned: data.owned,
              itemsById: data.itemsById,
              charactersById: data.charactersById,
            } satisfies ItemsOutlet
          }
        />
      )}
    </div>
  )
}
