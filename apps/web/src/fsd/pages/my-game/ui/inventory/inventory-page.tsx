import { Outlet, useMatch, useNavigate } from "react-router"
import { useTranslation } from "react-i18next"
import { Tabs } from "@workspace/ui/components/tabs"

import { usePlayerDataSyncStatus } from "@/features/player-data-sync"
import { PageTabsList, PageTabsTrigger } from "@/shared/ui"

import {
  INVENTORY_TABS,
  inventoryTabPath,
  isInventoryTab,
} from "../../model/inventory-tabs"

/**
 * My game > Inventory: what the player holds, read from the last sync, with what their goals still
 * need. The page's tabs (Upgrades, Ascension) are routes and use the game's own names; each tab owns
 * its toolbar. A muted line under the tabs says how old the counts are, beside the shell's Sync.
 */
export function InventoryPage() {
  const { t } = useTranslation(["inventory", "gameUi"])
  const navigate = useNavigate()
  const tab = useMatch("/my-game/inventory/:tab")?.params.tab
  const selected = isInventoryTab(tab) ? tab : "upgrades"

  return (
    <div className="flex min-w-0 flex-col gap-3" data-testid="inventory-page">
      <Tabs
        value={selected}
        onValueChange={(value) => {
          if (isInventoryTab(value)) void navigate(inventoryTabPath(value))
        }}
      >
        <PageTabsList
          aria-label={t("inventory:page.tabsLabel")}
          data-testid="inventory-tabs"
        >
          {INVENTORY_TABS.map((value) => (
            <PageTabsTrigger key={value} value={value}>
              {t(`gameUi:inventory.tabs.${value}`)}
            </PageTabsTrigger>
          ))}
        </PageTabsList>
      </Tabs>
      <SyncNote />
      <Outlet />
    </div>
  )
}

/** "Last synced 12 min ago" (or the running sync's progress), from the shared sync status. */
function SyncNote() {
  const { statusText } = usePlayerDataSyncStatus()
  return (
    <p
      className="text-xs text-muted-foreground"
      data-testid="inventory-sync-note"
      role="status"
    >
      {statusText}
    </p>
  )
}
