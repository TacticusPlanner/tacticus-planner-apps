import type {
  CampaignBattleRecord,
  CharacterRecord,
  UpgradeRecord,
} from "@workspace/game-catalog"

import type { BattleLike, FarmLocationLike } from "@/shared/lib"

import type { CharacterLike, UpgradeLike } from "./rank-lookup-calc"

// Typed adapters from raw `@workspace/game-catalog/queries` catalog rows to this feature's
// narrower calc-input shapes. Every field here is read off a fully-typed record (no `unknown`),
// so no cast is needed on either side — the only real transformation is the `craftable` →
// `crafted` rename between the catalog schema's field name and this feature's domain vocabulary.

export interface UpgradeWithFarmLocations extends UpgradeLike {
  farmLocations: FarmLocationLike[]
}

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
    type: record.type,
    challenge: record.challenge,
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
