import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { UpgradeStorageModel } from "@workspace/game-catalog"

import { mapUpgradeStorageToDomain } from "@/features/rank-lookup/@x/daily-raids"
import { useCatalogDataset } from "@/shared/local-data"

import { buildResourceByBattle } from "./daily-raid-battle-resources"
import type { DailyRaidBattleResource } from "./daily-raids.domain"
import type { BattleId } from "@workspace/game-domain"

const toDomainUpgrades = (records: UpgradeStorageModel[]) =>
  records.map(mapUpgradeStorageToDomain)

/** Catalog node -> drop index with the same localized labels Today uses (`use-daily-raids`). */
export function useResourceByBattleId(): ReadonlyMap<
  BattleId,
  DailyRaidBattleResource
> {
  const { t } = useTranslation(["dailies", "characters", "upgrades"])
  const upgradesRead = useCatalogDataset("upgrades", toDomainUpgrades)
  const charactersRead = useCatalogDataset("characters")
  const upgrades =
    upgradesRead.status === "ready" ? upgradesRead.data : undefined
  const characters =
    charactersRead.status === "ready" ? charactersRead.data : undefined
  return useMemo(
    () =>
      buildResourceByBattle(upgrades ?? [], characters ?? [], {
        upgrade: (id, catalogLabel) =>
          t(`upgrades:${id}`, { defaultValue: catalogLabel }),
        shards: (unitId, characterName) =>
          t("dailies:resource.shards", {
            unit: t(`characters:${unitId}`, { defaultValue: characterName }),
          }),
      }),
    [upgrades, characters, t]
  )
}
