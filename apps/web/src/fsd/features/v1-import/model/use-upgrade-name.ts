import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import { getUpgrades } from "@workspace/game-catalog/queries"

/** Display name for an upgrade material by id: its translation, else the catalog label, else the raw
 *  id (a V1 material the catalog no longer knows). */
export function useUpgradeName() {
  const { t } = useTranslation(["upgrades"])
  const upgrades = useLiveQuery(() => getUpgrades(), [])
  const labelById = useMemo(
    () =>
      new Map<string, string>(
        (upgrades ?? []).map((upgrade) => [upgrade.id, upgrade.label])
      ),
    [upgrades]
  )

  return (upgradeId: string): string =>
    t(`upgrades:${upgradeId}`, {
      defaultValue: labelById.get(upgradeId) ?? upgradeId,
    })
}
