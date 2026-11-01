import type { UpgradeId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import { inFlightInGlobalOrder, type GoalDetail } from "@/entities/goal"

type InventoryUpgrade = PlayerDataChunkDto<"inventory-upgrades">[number]

/**
 * Splits the synced upgrade-material stock between Upgrade goals, so two goals targeting the same
 * material don't both count the same pieces as theirs (30 owned, two goals needing 27 each: the
 * higher-priority one gets 27, the other 3). Active goals draw first, then Paused ones, each in global
 * order; a goal only takes what it still needs. The result holds one inventory view per in-flight
 * Upgrade goal; any other goal (Completed, Archived, another kind) has no entry and reads the full stock.
 * `undefined` stock (not loaded yet) yields no entries, so callers keep reporting it as unknown.
 */
export function allocateUpgradeGoalStock(
  goals: Iterable<GoalDetail>,
  inventoryUpgrades: readonly InventoryUpgrade[] | undefined
): ReadonlyMap<string, readonly InventoryUpgrade[]> {
  const result = new Map<string, readonly InventoryUpgrade[]>()
  if (!inventoryUpgrades) return result

  const remaining = new Map<UpgradeId, number>()
  for (const entry of inventoryUpgrades) {
    remaining.set(
      entry.upgradeId,
      (remaining.get(entry.upgradeId) ?? 0) + entry.amount
    )
  }

  const ordered = inFlightInGlobalOrder(
    [...goals].filter((goal) => goal.goalType === "Upgrade")
  )
  const drawOrder = [
    ...ordered.filter((goal) => goal.status === "Active"),
    ...ordered.filter((goal) => goal.status !== "Active"),
  ]
  for (const goal of drawOrder) {
    const share = new Map<UpgradeId, number>()
    for (const need of goal.config.upgrade?.targets ?? []) {
      const upgradeId = need.upgradeId as UpgradeId
      const available = remaining.get(upgradeId) ?? 0
      const taken = Math.min(available, need.quantity)
      remaining.set(upgradeId, available - taken)
      share.set(upgradeId, (share.get(upgradeId) ?? 0) + taken)
    }
    result.set(
      goal.goalId,
      [...share].map(([upgradeId, amount]) => ({ upgradeId, amount }))
    )
  }
  return result
}
