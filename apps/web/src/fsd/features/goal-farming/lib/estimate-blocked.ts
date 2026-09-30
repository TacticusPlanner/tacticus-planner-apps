import type { BattleId } from "@workspace/game-domain"

import type {
  Battle,
  EstimateBlockedReason,
  EstimateBlocker,
  EstimateOutcome,
  EstimateResourceId,
  EstimateUpgrade,
  FarmLocation,
  UpgradeNeed,
} from "../model/estimate.domain"

export function blocked(
  reason: EstimateBlockedReason,
  resourceIds: EstimateResourceId[]
): EstimateOutcome {
  return { status: "Blocked", reason, resourceIds }
}

/** A goal's residual needs that cannot be sourced, plus the resources still scheduled around them. */
export function partiallyBlocked(
  blockers: EstimateBlocker[],
  actionableResourceIds: EstimateResourceId[]
): EstimateOutcome {
  const merged = new Map<EstimateResourceId, EstimateBlocker>()
  for (const blocker of blockers) {
    const existing = merged.get(blocker.resourceId)
    merged.set(
      blocker.resourceId,
      existing
        ? { ...existing, remaining: existing.remaining + blocker.remaining }
        : { ...blocker }
    )
  }
  const list = [...merged.values()]
  return {
    status: "Blocked",
    reason: list[0]!.reason,
    resourceIds: list.map((blocker) => blocker.resourceId),
    blockers: list,
    actionableResourceIds: [...new Set(actionableResourceIds)],
  }
}

export function unavailableReason(
  need: UpgradeNeed,
  upgradesById: ReadonlyMap<EstimateResourceId, EstimateUpgrade>,
  battlesById: ReadonlyMap<BattleId, Battle>,
  farmingLocationIds: readonly string[] | null | undefined,
  dailyEnergy: number
): EstimateBlockedReason | null {
  const upgrade = upgradesById.get(need.id)
  const available = (upgrade?.farmLocations ?? []).filter((location) => {
    const battle = battlesById.get(location.battleId)
    return !!battle && locationDropRate(location) > 0 && battle.energyCost > 0
  })
  if (available.length === 0) return "NoFarmLocation"
  const restricted = farmingLocationIds?.length
    ? available.filter((location) =>
        farmingLocationIds.includes(location.battleId)
      )
    : available
  if (restricted.length === 0) return "FarmingOverrideUnavailable"
  if (
    restricted.every(
      (location) => battlesById.get(location.battleId)!.energyCost > dailyEnergy
    )
  ) {
    return "InsufficientDailyEnergy"
  }
  return null
}

function locationDropRate(location: FarmLocation): number {
  if (location.guaranteed) return 1
  if (location.effectiveRate != null) return location.effectiveRate
  if (location.numerator != null && location.denominator) {
    return location.numerator / location.denominator
  }
  return 0
}
