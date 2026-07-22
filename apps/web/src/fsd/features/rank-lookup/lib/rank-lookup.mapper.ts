import type {
  CampaignBattleStorageModel,
  CharacterStorageModel,
  UpgradeStorageModel,
} from "@workspace/game-catalog"

import type { Battle, FarmLocation } from "@/shared/lib"

import type { Character, Upgrade } from "./rank-lookup.domain"

// Mappers from raw `@workspace/game-catalog/queries` storage models to this feature's narrower
// domain shapes. Every field here is read off a fully-typed storage model (no `unknown`), so no cast
// is needed on either side — the only real transformation is the `craftable` → `crafted` rename
// between the catalog schema's field name and this feature's domain vocabulary.

export interface UpgradeWithFarmLocations extends Upgrade {
  farmLocations: FarmLocation[]
}

export function mapUpgradeStorageToDomain(
  record: UpgradeStorageModel
): UpgradeWithFarmLocations {
  return {
    id: record.id,
    label: record.label,
    rarity: record.rarity,
    stat: record.stat,
    crafted: record.craftable,
    recipe: record.recipe,
    farmLocations: record.farmLocations,
  }
}

export function mapCampaignBattleStorageToDomain(
  record: CampaignBattleStorageModel
): Battle & { id: string } {
  return {
    id: record.id,
    campaignGroupId: record.campaignGroupId,
    type: record.type,
    challenge: record.challenge,
    nodeNumber: record.nodeNumber,
    energyCost: record.energyCost,
    dailyAttempts: record.dailyAttempts,
  }
}

export function mapCharacterStorageToDomain(
  record: CharacterStorageModel
): Character {
  return {
    id: record.id,
    name: record.name,
    rankUpUpgrades: record.rankUpUpgrades,
  }
}
