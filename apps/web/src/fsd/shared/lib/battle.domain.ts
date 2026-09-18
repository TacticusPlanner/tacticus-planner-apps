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
  // True only for a character's mythic-shard reward locations — always false for an upgrade
  // material's own farm locations (see the catalog's farmLocationSchema doc comment).
  isMythic: boolean
  // A property of the battle, not of this resource: the average of the battle's own guaranteed
  // gold reward, null when it guarantees none. Optional (matching the schema's `.optional()`) so
  // every existing direct-passthrough call site (this catalog's storage models are handed straight
  // through as `FarmLocation[]` in several places, not funneled through one mapper) keeps
  // type-checking without new per-call-site normalization; a consumer that cares about the
  // distinction (only `selectFarmNodes`'s tie-break) treats an absent key the same as `null`.
  expectedGold?: number | null
}

export interface Battle {
  campaignGroupId: CampaignId
  type: string
  challenge: boolean
  nodeNumber: number
  energyCost: number
  // Daily attempt cap for this battle (Elite/EliteMirror = 6, everything else = 10 — see the
  // catalog's CampaignDenormalizer.DailyAttemptsForType). Shared across every material/shard farmed
  // from the same node within one simulated day (see estimate.ts's spendDay).
  dailyAttempts: number
}
