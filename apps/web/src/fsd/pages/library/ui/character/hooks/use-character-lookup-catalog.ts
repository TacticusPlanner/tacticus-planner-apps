import { useMemo } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import type { CampaignDefinitionStorageModel } from "@workspace/game-catalog"
import {
  getCampaignBattles,
  getCampaignDefinitions,
  getCharactersMap,
  getUpgrades,
} from "@workspace/game-catalog/queries"

import {
  mapCampaignBattleStorageToDomain,
  mapUpgradeStorageToDomain,
} from "@/features/rank-lookup"

const toReleaseType = (definition: CampaignDefinitionStorageModel) =>
  definition.releaseType

/**
 * The static-catalog reads the rank-up calculator needs, id-keyed for O(1) lookup by the calc
 * functions — split out of the tab component so it isn't buried among its own player-data/selection
 * state.
 */
export function useCharacterLookupCatalog() {
  const charactersById = useLiveQuery(() => getCharactersMap(), [])

  const upgrades = useLiveQuery(() => getUpgrades(), [])
  const upgradesById = useMemo(
    () =>
      new Map(
        (upgrades ?? []).map((u) => [u.id, mapUpgradeStorageToDomain(u)])
      ),
    [upgrades]
  )

  const campaignBattles = useLiveQuery(() => getCampaignBattles(), [])
  const battlesById = useMemo(
    () =>
      new Map(
        (campaignBattles ?? []).map((b) => [
          b.id,
          mapCampaignBattleStorageToDomain(b),
        ])
      ),
    [campaignBattles]
  )

  // Index by the schema-validated groupId rather than the storage-managed id alias so the map's
  // key retains the canonical CampaignId brand.
  const campaignDefinitions = useLiveQuery(() => getCampaignDefinitions(), [])
  const releaseTypeByGroupId = useMemo(
    () =>
      new Map(
        (campaignDefinitions ?? []).map((d) => [d.groupId, toReleaseType(d)])
      ),
    [campaignDefinitions]
  )

  const loading = charactersById === undefined || upgrades === undefined

  return {
    charactersById,
    upgradesById,
    battlesById,
    releaseTypeByGroupId,
    loading,
  }
}
