import type { MowStorageModel } from "@workspace/game-catalog"
import type { UnitId, UpgradeId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import { inFlightInGlobalOrder, type GoalDetail } from "@/entities/goal"
import {
  mowAbilityGoalSlotItems,
  rankGoalSlotItems,
  upgradeGoalRangeSlotItems,
  type GoalSlotItem,
} from "@/features/goal-farming/@x/goal-planning"

type InventoryUpgrade = PlayerDataChunkDto<"inventory-upgrades">[number]
type PlayerCharacter = PlayerDataChunkDto<"characters">[number]
type PlayerMow = PlayerDataChunkDto<"mows">[number]
type FarmingCharacter = Parameters<typeof rankGoalSlotItems>[0]["character"]

/** Catalog and roster lookups that let Rank and Machine of War Ability goals take part in the split.
 *  Omitted (or before the catalog loads), only Upgrade goals draw from the stock. */
export type UpgradeStockUnits = {
  getCharacter: (unitId: UnitId) => FarmingCharacter
  getMow: (unitId: UnitId) => MowStorageModel | undefined
  playerCharacterById: ReadonlyMap<string, PlayerCharacter>
  playerMowById: ReadonlyMap<string, PlayerMow>
}

/**
 * Splits the synced upgrade-material stock between goals in priority order, so goals that need the
 * same material don't all count the same pieces as theirs (30 owned, two Upgrade goals needing 27
 * each: the higher-priority one gets 27, the other 3). Active goals draw first, then Paused ones, each
 * in global order.
 *
 * - A Rank goal, or a Machine of War Ability goal, draws one piece per unapplied slot it still has to
 *   fill. It reports no attainment from stock, but what it draws is gone for the goals after it.
 * - An Upgrade goal takes what it still needs of each target. Slots of its range that an earlier goal
 *   on the same unit already drew a piece for count toward it first: they are the same pieces for the
 *   same slots, so a Rank goal and an Upgrade goal on one unit never compete with each other. The
 *   range slots it fills are then marked drawn, so a later Rank/Ability goal on the unit doesn't draw
 *   them again. A goal without a range is additive and takes only from stock.
 *
 * The result holds one inventory view per in-flight Upgrade goal; any other goal (Completed, Archived,
 * another kind) has no entry and reads the full stock. `undefined` stock (not loaded yet) yields no
 * entries, so callers keep reporting it as unknown. Pieces are matched by id only: a Rank slot that
 * needs a crafted item doesn't draw that item's components.
 */
export function allocateUpgradeGoalStock(
  goals: Iterable<GoalDetail>,
  inventoryUpgrades: readonly InventoryUpgrade[] | undefined,
  units?: UpgradeStockUnits
): ReadonlyMap<string, readonly InventoryUpgrade[]> {
  const result = new Map<string, readonly InventoryUpgrade[]>()
  if (!inventoryUpgrades) return result

  const stock = new Map<UpgradeId, number>()
  for (const entry of inventoryUpgrades) {
    stock.set(entry.upgradeId, (stock.get(entry.upgradeId) ?? 0) + entry.amount)
  }
  const take = (id: UpgradeId, count: number) => {
    const taken = Math.min(stock.get(id) ?? 0, count)
    stock.set(id, (stock.get(id) ?? 0) - taken)
    return taken
  }

  // Per unit: the slots an earlier goal already drew for, and whether stock held a piece for it.
  const drawnByUnit = new Map<string, Map<string, boolean>>()
  const drawnFor = (entityId: string) => {
    const drawn = drawnByUnit.get(entityId) ?? new Map<string, boolean>()
    drawnByUnit.set(entityId, drawn)
    return drawn
  }

  const ordered = inFlightInGlobalOrder([...goals])
  const drawOrder = [
    ...ordered.filter((goal) => goal.status === "Active"),
    ...ordered.filter((goal) => goal.status !== "Active"),
  ]
  for (const goal of drawOrder) {
    const unitId = goal.entityId as UnitId
    const unit = units && {
      character: units.getCharacter(unitId),
      mow: units.getMow(unitId),
      playerCharacter: units.playerCharacterById.get(goal.entityId),
      playerMow: units.playerMowById.get(goal.entityId),
    }

    if (goal.goalType === "Upgrade") {
      const rangeItems: readonly GoalSlotItem[] = unit
        ? upgradeGoalRangeSlotItems({ detail: goal, ...unit })
        : []
      const drawn = drawnFor(goal.entityId)
      const counted = new Set<string>()
      const share = new Map<UpgradeId, number>()
      for (const need of goal.config.upgrade?.targets ?? []) {
        const id = need.upgradeId as UpgradeId
        const slots = rangeItems.filter(
          (item) => item.id === id && !counted.has(item.key)
        )
        let fromEarlierGoals = 0
        for (const slot of slots) {
          if (fromEarlierGoals >= need.quantity) break
          if (drawn.get(slot.key) !== true) continue
          counted.add(slot.key)
          fromEarlierGoals++
        }
        const stillNeeded = need.quantity - fromEarlierGoals
        const taken = take(id, stillNeeded)
        let claimed = 0
        for (const slot of slots) {
          if (claimed >= stillNeeded) break
          if (drawn.has(slot.key)) continue
          drawn.set(slot.key, claimed < taken)
          counted.add(slot.key)
          claimed++
        }
        share.set(id, (share.get(id) ?? 0) + fromEarlierGoals + taken)
      }
      result.set(
        goal.goalId,
        [...share].map(([upgradeId, amount]) => ({ upgradeId, amount }))
      )
      continue
    }

    if (!unit) continue
    const slotItems =
      goal.goalType === "Rank"
        ? rankGoalSlotItems({ detail: goal, ...unit })
        : goal.goalType === "Ability"
          ? mowAbilityGoalSlotItems({ detail: goal, ...unit })
          : []
    const drawn = drawnFor(goal.entityId)
    for (const item of slotItems) {
      if (drawn.has(item.key)) continue
      drawn.set(item.key, take(item.id, 1) === 1)
    }
  }
  return result
}
