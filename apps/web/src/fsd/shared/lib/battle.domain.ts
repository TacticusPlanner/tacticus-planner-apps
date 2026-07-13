import type { BattleId, CampaignId } from "@workspace/game-domain"

// Structural battle/farm-location shapes shared across feature slices that each derive them from
// their own richer catalog storage-model types (e.g. rank-lookup's `rank-lookup.mapper.ts` mapping a
// catalog `CampaignBattleStorageModel` into a `Battle`) — kept here rather than colocated with any
// one consumer since more than one slice produces or consumes these shapes.

export interface FarmLocation {
  battleId: BattleId
  guaranteed: boolean
  effectiveRate: number | null
  numerator: number | null
  denominator: number | null
}

export interface Battle {
  campaignGroupId: CampaignId
  type: string
  challenge: boolean
  nodeNumber: number
  energyCost: number
}
