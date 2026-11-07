import type { BattleId, UpgradeId } from "@workspace/game-domain"

import type { PlanCell } from "./plan-day-cells"

type FarmableUpgrade = {
  id: UpgradeId
  farmLocations: readonly { battleId: BattleId }[]
}

/** A campaign node that drops a plan cell's material but that the cell's day does not raid. */
export type PlanCellAlternative = {
  battleId: BattleId
  /** Not raidable for the plan right now: the campaign (or event) isn't unlocked or progressed far
   *  enough, or a filter excludes it — so the engine could not pick it. */
  locked: boolean
}

/**
 * Every catalog farm location per upgrade material, keyed by upgrade id — the full list the Schedule
 * tooltip draws a cell's alternative locations from. A node listed twice for one material
 * (guaranteed + potential drops) appears once, in catalog order.
 */
export function buildFarmLocationsByUpgrade(
  upgrades: Iterable<FarmableUpgrade>
): ReadonlyMap<string, readonly BattleId[]> {
  const byUpgrade = new Map<string, readonly BattleId[]>()
  for (const upgrade of upgrades) {
    if (upgrade.farmLocations.length === 0) continue
    byUpgrade.set(upgrade.id, [
      ...new Set(upgrade.farmLocations.map((location) => location.battleId)),
    ])
  }
  return byUpgrade
}

/**
 * The other campaign nodes that drop a plan cell's material (feature request "Show alternative
 * retrieval campaigns for upgrades"): every catalog farm location the day doesn't already raid for
 * it, the ones the plan could raid first, then the locked ones — catalog order within each group.
 */
export function planCellAlternatives(
  cell: Pick<PlanCell, "resourceId" | "nodes">,
  farmLocationsByResource: ReadonlyMap<string, readonly BattleId[]>,
  eligibleBattleIds: ReadonlySet<BattleId>
): PlanCellAlternative[] {
  const planned = new Set(cell.nodes.map((node) => node.battleId))
  const alternatives = (farmLocationsByResource.get(cell.resourceId) ?? [])
    .filter((battleId) => !planned.has(battleId))
    .map((battleId) => ({
      battleId,
      locked: !eligibleBattleIds.has(battleId),
    }))
  return [
    ...alternatives.filter((alternative) => !alternative.locked),
    ...alternatives.filter((alternative) => alternative.locked),
  ]
}
