import { useTranslation } from "react-i18next"
import type { UpgradeStorageModel } from "@workspace/game-catalog"

import { useCatalogDataset } from "@/shared/local-data"

const toLabelById = (records: UpgradeStorageModel[]) =>
  new Map<string, string>(records.map((upgrade) => [upgrade.id, upgrade.label]))

/** Display name for an upgrade material by id: its translation, else the catalog label, else the raw
 *  id (a V1 material the catalog no longer knows). */
export function useUpgradeName() {
  const { t } = useTranslation(["upgrades"])
  const upgradesRead = useCatalogDataset("upgrades", toLabelById)
  const labelById =
    upgradesRead.status === "ready" ? upgradesRead.data : undefined

  return (upgradeId: string): string =>
    t(`upgrades:${upgradeId}`, {
      defaultValue: labelById?.get(upgradeId) ?? upgradeId,
    })
}
