import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"
import {
  groupByFaction,
  type CampaignDefinitionStorageModel,
} from "@workspace/game-catalog"
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
 * The static-catalog reads Character Lookup needs, id-keyed for O(1) lookup by the calc functions —
 * split out of the page component so it isn't buried among the page's own player-data/selection
 * state. `t` is bound with its own `useTranslation` call (not threaded in as a parameter) because
 * i18next's `TFunction<Ns>` is nominally branded per namespace list, so a `t` scoped to the page's
 * broader namespace set wouldn't satisfy this hook's narrower one anyway (see
 * `@/shared/lib/use-campaign-display.ts` for the same reasoning).
 */
export function useCharacterLookupCatalog() {
  const { t } = useTranslation(["characters", "factions"])

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

  // A campaign-definition's `id` is already its `groupId` (see `groupsWithId` in
  // game-catalog-storage.ts), so indexing by `id` here doubles as indexing by `groupId`.
  const campaignDefinitions = useLiveQuery(() => getCampaignDefinitions(), [])
  const releaseTypeByGroupId = useMemo(
    () =>
      new Map((campaignDefinitions ?? []).map((d) => [d.id, toReleaseType(d)])),
    [campaignDefinitions]
  )

  const characterGroups = useMemo(
    () =>
      groupByFaction(
        [...(charactersById?.values() ?? [])].map((c) => ({
          id: c.id,
          name: t(`characters:${c.id}`, { defaultValue: c.name }),
          faction: c.faction,
        })),
        (factionId) => t(`factions:${factionId}`, { defaultValue: factionId })
      ),
    [charactersById, t]
  )

  const loading = charactersById === undefined || upgrades === undefined

  return {
    charactersById,
    upgradesById,
    battlesById,
    releaseTypeByGroupId,
    characterGroups,
    loading,
  }
}
