import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import { getCharactersMap, getUpgrades } from "@workspace/game-catalog/queries"

import { mapUpgradeStorageToDomain } from "@/features/rank-lookup/@x/daily-raids"

import { buildResourceByBattle } from "./daily-raid-battle-resources"
import type { DailyRaidBattleResource } from "./daily-raids.domain"
import type { BattleId } from "@workspace/game-domain"

/** Catalog node -> drop index with the same localized labels Today uses (`use-daily-raids`). */
export function useResourceByBattleId(): ReadonlyMap<
  BattleId,
  DailyRaidBattleResource
> {
  const { t } = useTranslation(["dailies", "characters", "upgrades"])
  const upgrades = useLiveQuery(() => getUpgrades(), [])
  const characters = useLiveQuery(() => getCharactersMap(), [])
  return useMemo(
    () =>
      buildResourceByBattle(
        (upgrades ?? []).map(mapUpgradeStorageToDomain),
        characters?.values() ?? [],
        {
          upgrade: (id, catalogLabel) =>
            t(`upgrades:${id}`, { defaultValue: catalogLabel }),
          shards: (unitId, characterName) =>
            t("dailies:resource.shards", {
              unit: t(`characters:${unitId}`, { defaultValue: characterName }),
            }),
        }
      ),
    [upgrades, characters, t]
  )
}
