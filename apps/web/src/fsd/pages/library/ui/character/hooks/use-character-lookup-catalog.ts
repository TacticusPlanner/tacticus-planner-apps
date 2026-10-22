import type {
  CampaignBattleStorageModel,
  CampaignDefinitionStorageModel,
  UpgradeStorageModel,
} from "@workspace/game-catalog"

import {
  mapCampaignBattleStorageToDomain,
  mapUpgradeStorageToDomain,
} from "@/features/rank-lookup"
import { toById, useCatalogDataset } from "@/shared/local-data"

const EMPTY = new Map<never, never>()

function upgradesToDomainById(upgrades: UpgradeStorageModel[]) {
  return new Map(upgrades.map((u) => [u.id, mapUpgradeStorageToDomain(u)]))
}

function battlesToDomainById(battles: CampaignBattleStorageModel[]) {
  return new Map(
    battles.map((b) => [b.id, mapCampaignBattleStorageToDomain(b)])
  )
}

// Index by the schema-validated groupId rather than the storage-managed id alias so the map's
// key retains the canonical CampaignId brand.
function releaseTypesByGroupId(definitions: CampaignDefinitionStorageModel[]) {
  return new Map(definitions.map((d) => [d.groupId, d.releaseType]))
}

/**
 * The static-catalog reads the rank-up calculator needs, id-keyed for O(1) lookup by the calc
 * functions — split out of the tab component so it isn't buried among its own player-data/selection
 * state.
 */
export function useCharacterLookupCatalog() {
  const characters = useCatalogDataset("characters", toById)
  const upgrades = useCatalogDataset("upgrades", upgradesToDomainById)
  const battles = useCatalogDataset("campaign-battles", battlesToDomainById)
  const releaseTypes = useCatalogDataset(
    "campaign-definitions",
    releaseTypesByGroupId
  )

  return {
    charactersById: characters.status === "ready" ? characters.data : undefined,
    upgradesById: upgrades.status === "ready" ? upgrades.data : EMPTY,
    battlesById: battles.status === "ready" ? battles.data : EMPTY,
    releaseTypeByGroupId:
      releaseTypes.status === "ready" ? releaseTypes.data : EMPTY,
    loading: characters.status !== "ready" || upgrades.status !== "ready",
  }
}
