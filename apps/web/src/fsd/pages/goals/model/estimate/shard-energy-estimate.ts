import { estimateGoal } from ".//estimate"
import { shardResourceId } from ".//estimate.domain"
import type { EstimateOutcome, FarmLocation } from ".//estimate.domain"

/**
 * The estimated energy to farm `remainingShards` more of a character's regular shard, restricted to
 * the selected shard-farm locations (empty = unrestricted, auto-picks the least-energy node(s) among
 * all of them) — shared by the Unlock card's and the Ascension card's own "energy for remaining
 * shards" line (plan: shard-location selector), each computed from their own isolated remaining-shard
 * count rather than a figure combined across both goal types. `null` when there's nothing left to
 * farm (`remainingShards <= 0`).
 */
export function estimateRemainingShardEnergy(params: {
  entityId: string
  remainingShards: number
  shardLocations: FarmLocation[]
  battlesById: Parameters<typeof estimateGoal>[0]["battlesById"]
  farmingLocationIds: readonly string[]
  dailyEnergy: number
}): EstimateOutcome | null {
  if (params.remainingShards <= 0) return null

  const shardId = shardResourceId(params.entityId)
  return estimateGoal({
    needs: [{ id: shardId, count: params.remainingShards }],
    upgradesById: new Map([
      [shardId, { id: shardId, farmLocations: params.shardLocations }],
    ]),
    battlesById: params.battlesById,
    dailyEnergy: params.dailyEnergy,
    farmingLocationIds:
      params.farmingLocationIds.length > 0
        ? params.farmingLocationIds
        : undefined,
  })
}
