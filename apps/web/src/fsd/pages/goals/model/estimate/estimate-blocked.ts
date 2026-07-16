import type { BattleId } from "@workspace/game-domain"

import type {
  Battle,
  EstimateBlockedReason,
  EstimateOutcome,
  EstimateResourceId,
  EstimateUpgrade,
  FarmLocation,
  UpgradeNeed,
} from "./estimate.domain"

export function blocked(
  reason: EstimateBlockedReason,
  resourceIds: EstimateResourceId[]
): EstimateOutcome {
  return { status: "Blocked", reason, resourceIds }
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
