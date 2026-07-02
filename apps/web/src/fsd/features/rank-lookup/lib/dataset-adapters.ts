import type {
  CampaignBattleRecord,
  CharacterRecord,
  UpgradeRecord,
} from "@workspace/game-catalog"

import type { CharacterLike } from "./rank-lookup-calc"
import type { BattleLike, UpgradeWithFarmLocations } from "./campaign-insights"

// Typed adapters from raw `useDatasetRecords`/`getDatasetRecords` catalog rows to this feature's
// narrower calc-input shapes. Every field here is read off a fully-typed record (no `unknown`),
// so no cast is needed on either side — the only real transformation is the `craftable` →
// `crafted` rename between the catalog schema's field name and this feature's domain vocabulary.

export function toUpgradeWithFarmLocations(
  record: UpgradeRecord
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

export function toBattleLike(
  record: CampaignBattleRecord
): BattleLike & { id: string } {
  return {
    id: record.id,
    campaignGroupId: record.campaignGroupId,
    difficulty: record.difficulty,
    nodeNumber: record.nodeNumber,
    energyCost: record.energyCost,
  }
}

export function toCharacterLike(record: CharacterRecord): CharacterLike {
  return {
    id: record.id,
    name: record.name,
    rankUpUpgrades: record.rankUpUpgrades,
  }
}
