import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import type {
  CampaignBattleStorageModel,
  UpgradeStorageModel,
} from "@workspace/game-catalog"
import type { UpgradeId } from "@workspace/game-domain"

import {
  mapCampaignBattleStorageToDomain,
  mapUpgradeStorageToDomain,
} from "@/entities/rank-lookup"
import { usePlanItemNeeds } from "@/features/goal-planning"
import { useCatalogDataset } from "@/shared/local-data"

import { buildUpgradeRows, heldById } from "./inventory-upgrades"

const toUpgrades = (records: UpgradeStorageModel[]) =>
  records.map(mapUpgradeStorageToDomain)
const toBattlesById = (records: CampaignBattleStorageModel[]) =>
  new Map(
    records.map((record) => [
      record.id,
      mapCampaignBattleStorageToDomain(record),
    ])
  )

/**
 * The Upgrades tab's data: every catalog material as a row (held from the synced inventory, need and
 * short from the goals' plan run, what can be crafted now), plus the lookups its details sheet uses.
 * `status` covers the catalog read; the goal needs load on their own (`needs`), so the held counts
 * show at once and the need columns fill in when the plan run is done.
 */
export function useInventoryUpgrades(
  inventory: readonly { upgradeId: string; amount: number }[]
) {
  const { t } = useTranslation("upgrades")
  const upgradesRead = useCatalogDataset("upgrades", toUpgrades)
  const battlesRead = useCatalogDataset("campaign-battles", toBattlesById)
  const plan = usePlanItemNeeds()

  const upgrades =
    upgradesRead.status === "ready" ? upgradesRead.data : undefined
  const held = useMemo(() => heldById(inventory), [inventory])
  const upgradesById = useMemo(
    () => new Map((upgrades ?? []).map((upgrade) => [upgrade.id, upgrade])),
    [upgrades]
  )
  const name = useCallback(
    (id: UpgradeId, fallback: string) =>
      t(`upgrades:${id}`, { defaultValue: fallback }),
    [t]
  )
  const needsReady = !plan.loading && !plan.isError
  const rows = useMemo(
    () =>
      upgrades
        ? buildUpgradeRows({
            upgrades,
            held,
            needs: plan.needs.upgrades,
            name,
          })
        : [],
    [upgrades, held, plan.needs.upgrades, name]
  )
  const battlesById =
    battlesRead.status === "ready" ? battlesRead.data : undefined

  return {
    status: upgradesRead.status,
    retry: upgradesRead.retry,
    rows,
    held,
    upgradesById,
    battlesById,
    battles: { status: battlesRead.status, retry: battlesRead.retry },
    name,
    needs: { ready: needsReady, isError: plan.isError, retry: plan.retry },
  }
}
