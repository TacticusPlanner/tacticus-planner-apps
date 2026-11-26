import { useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import type { PlayerDataChunkDto } from "@workspace/player-data"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { usePlayerChunk } from "@/shared/local-data"
import { EmptyState, LocalReadFailure } from "@/shared/ui"

import {
  filterUpgradeRows,
  groupUpgradeRows,
  sortUpgradeRows,
} from "../../model/inventory-upgrades"
import {
  CLEARED_FILTERS,
  hasActiveFilters,
} from "../../model/inventory-upgrades-query"
import { useInventoryUpgrades } from "../../model/use-inventory-upgrades"
import { useInventoryUpgradesQuery } from "../../model/use-inventory-upgrades-query"
import { InventoryReadGate } from "./inventory-read-gate"
import { useInventoryTutorial } from "./inventory.tutorial"
import type { InventoryTabStep } from "./inventory.tutorial"
import { MaterialDetailsDialog } from "./upgrades/material-details-dialog"
import { UpgradesList } from "./upgrades/upgrades-list"
import { UpgradesToolbar } from "./upgrades/upgrades-toolbar"

const TOUR_STEPS: readonly InventoryTabStep[] = [
  { target: "inventory-upgrades-toolbar", key: "upgradesToolbar" },
  { target: "inventory-upgrades-list", key: "upgradesList", optional: true },
]

/** Inventory > Upgrades: every upgrade material, with what is held and what the goals need. */
export function InventoryUpgradesTab() {
  useInventoryTutorial(TOUR_STEPS)
  const read = usePlayerChunk("inventory-upgrades")
  return (
    <InventoryReadGate read={read}>
      {(inventory) => <UpgradesContent inventory={inventory} />}
    </InventoryReadGate>
  )
}

function UpgradesContent({
  inventory,
}: {
  inventory: PlayerDataChunkDto<"inventory-upgrades">
}) {
  const { t } = useTranslation("inventory")
  const { query, update } = useInventoryUpgradesQuery()
  const data = useInventoryUpgrades(inventory)
  // The button that opened the details, to hand focus back to when they close.
  const opener = useRef<HTMLElement | null>(null)
  const needsReady = data.needs.ready
  const groups = useMemo(
    () =>
      groupUpgradeRows(
        sortUpgradeRows(
          // Every need reads 0 until the plan run is done: hold "Needed" off until then rather than
          // emptying the list.
          filterUpgradeRows(
            data.rows,
            needsReady ? query : { ...query, needed: false }
          ),
          query.sort
        ),
        query.group
      ),
    [data.rows, query, needsReady]
  )
  const selected = query.material
    ? data.rows.find((row) => row.id === query.material)
    : undefined

  if (data.status === "error") return <LocalReadFailure retry={data.retry} />

  return (
    <div className="flex flex-col gap-4">
      <UpgradesToolbar query={query} update={update} />
      {data.needs.isError ? (
        <p
          className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
          role="status"
        >
          {t("upgrades.needsFailed")}
          <Button onClick={data.needs.retry} size="sm" variant="outline">
            {t("upgrades.retry")}
          </Button>
        </p>
      ) : data.needs.ready ? null : (
        <p className="text-sm text-muted-foreground" role="status">
          {t("upgrades.needsLoading")}
        </p>
      )}
      {data.status === "loading" ? (
        <Skeleton className="h-64 w-full" />
      ) : groups.length === 0 || groups.every((g) => g.rows.length === 0) ? (
        <NoMatch
          onClear={() =>
            update(
              hasActiveFilters({ ...query, search: "" })
                ? CLEARED_FILTERS
                : { search: "" }
            )
          }
          searchOnly={!hasActiveFilters({ ...query, search: "" })}
        />
      ) : (
        <UpgradesList
          groups={groups}
          layout={query.layout}
          needsReady={data.needs.ready}
          onOpen={(row, button) => {
            opener.current = button
            update({ material: row.id })
          }}
        />
      )}
      <MaterialDetailsDialog
        battles={data.battles}
        battlesById={data.battlesById}
        held={data.held}
        name={data.name}
        needsReady={data.needs.ready}
        onCloseAutoFocus={(event) => {
          // Opened from state, not a Radix trigger: hand focus back to the material.
          if (!opener.current?.isConnected) return
          event.preventDefault()
          opener.current.focus()
        }}
        onOpenChange={(open) => {
          if (!open) update({ material: null })
        }}
        row={selected}
        upgradesById={data.upgradesById}
      />
    </div>
  )
}

/** Nothing matches: offer Clear search when only the search narrows the list, else Clear filters. */
function NoMatch({
  onClear,
  searchOnly,
}: {
  onClear: () => void
  searchOnly: boolean
}) {
  const { t } = useTranslation("inventory")
  return (
    <EmptyState
      actions={
        <Button onClick={onClear} variant="outline">
          {searchOnly
            ? t("upgrades.noMatch.clearSearch")
            : t("upgrades.toolbar.clearFilters")}
        </Button>
      }
      description={t("upgrades.noMatch.description")}
      testId="inventory-upgrades-no-match"
      title={t("upgrades.noMatch.title")}
      variant="no-match"
    />
  )
}
