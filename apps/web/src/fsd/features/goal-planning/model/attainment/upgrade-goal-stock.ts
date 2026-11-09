import type { MowStorageModel } from "@workspace/game-catalog"
import type { UnitId, UpgradeId } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import {
  inFlightInGlobalOrder,
  resolveGoalLinks,
  type GoalDetail,
} from "@/entities/goal"
import {
  mowAbilityGoalSlotItems,
  rankGoalSlotItems,
  targetUnitsInSlots,
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
  /** Recipes, so an Upgrade goal's base material matches its pieces inside a crafted range slot.
   *  Omitted, only slots holding the target itself match. */
  upgradesById?: Parameters<typeof targetUnitsInSlots>[2]
}

/** An earlier-drawing goal that holds pieces of one material an Upgrade goal targets. `counted` pieces
 *  are the same pieces for the same slots (an earlier goal on the same unit), so they count toward the
 *  Upgrade goal; otherwise the earlier goal took them from the stock ahead of it, leaving it short. */
type UpgradeStockHolder = {
  goalId: string
  amount: number
  counted: boolean
}

type UpgradeGoalStockSplit = {
  /** One inventory view per in-flight Upgrade goal (see {@link allocateUpgradeGoalStock}). */
  stock: ReadonlyMap<string, readonly InventoryUpgrade[]>
  /** Per in-flight Upgrade goal, per targeted material: the earlier goals that hold some of it — the
   *  ones whose pieces count toward it, and, when it is still short, the ones that took the rest of
   *  the stock first. Materials no earlier goal touched have no entry. */
  holders: ReadonlyMap<
    string,
    ReadonlyMap<UpgradeId, readonly UpgradeStockHolder[]>
  >
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
 * entries, so callers keep reporting it as unknown. An Upgrade goal for a base material matches
 * its pieces inside crafted range slots (with `units.upgradesById`): a crafted piece an earlier Rank
 * goal drew holds them, and the pieces the Upgrade goal claims stay its own. A Rank slot still draws
 * only its own item from the stock, never that item's components.
 */
export function allocateUpgradeGoalStock(
  goals: Iterable<GoalDetail>,
  inventoryUpgrades: readonly InventoryUpgrade[] | undefined,
  units?: UpgradeStockUnits
): ReadonlyMap<string, readonly InventoryUpgrade[]> {
  return splitUpgradeGoalStock(goals, inventoryUpgrades, units).stock
}

/** {@link allocateUpgradeGoalStock}, plus which earlier goals hold each Upgrade goal's materials, so a
 *  row can say why a lower-priority goal is reached while a higher one is short. */
export function splitUpgradeGoalStock(
  goals: Iterable<GoalDetail>,
  inventoryUpgrades: readonly InventoryUpgrade[] | undefined,
  units?: UpgradeStockUnits
): UpgradeGoalStockSplit {
  const result = new Map<string, readonly InventoryUpgrade[]>()
  const holders = new Map<
    string,
    ReadonlyMap<UpgradeId, readonly UpgradeStockHolder[]>
  >()
  if (!inventoryUpgrades) return { stock: result, holders }

  const stock = new Map<UpgradeId, number>()
  for (const entry of inventoryUpgrades) {
    stock.set(entry.upgradeId, (stock.get(entry.upgradeId) ?? 0) + entry.amount)
  }
  // Per material: who took pieces from the stock so far, in draw order.
  const takenBy = new Map<UpgradeId, Map<string, number>>()
  const take = (goalId: string, id: UpgradeId, count: number) => {
    const taken = Math.min(stock.get(id) ?? 0, count)
    stock.set(id, (stock.get(id) ?? 0) - taken)
    if (taken > 0) {
      const takers = takenBy.get(id) ?? new Map<string, number>()
      takenBy.set(id, takers)
      takers.set(goalId, (takers.get(goalId) ?? 0) + taken)
    }
    return taken
  }

  // Per unit: the slots an earlier goal already drew for, whether stock held a piece for it, and
  // which goal drew it.
  type Drawn = { held: boolean; goalId: string }
  const drawnByUnit = new Map<string, Map<string, Drawn>>()
  const drawnFor = (entityId: string) => {
    const drawn = drawnByUnit.get(entityId) ?? new Map<string, Drawn>()
    drawnByUnit.set(entityId, drawn)
    return drawn
  }

  // A linked Upgrade goal's range is its linked goals' span, so it counts toward exactly those slots.
  const ordered = inFlightInGlobalOrder(resolveGoalLinks([...goals]))
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
      const goalHolders = new Map<UpgradeId, UpgradeStockHolder[]>()
      for (const need of goal.config.upgrade?.targets ?? []) {
        const id = need.upgradeId as UpgradeId
        // The target's pieces in the range: slots holding it, and its base pieces inside crafted slots.
        const pieces = (
          units?.upgradesById
            ? targetUnitsInSlots(rangeItems, id, units.upgradesById)
            : rangeItems
                .filter((item) => item.id === id)
                .map((item) => ({ slotKey: item.key, key: item.key }))
        ).filter((piece) => !counted.has(piece.key))
        // A piece is held by an earlier goal that drew its whole slot, or that claimed the piece itself.
        const holderOf = (piece: { slotKey: string; key: string }) =>
          drawn.get(piece.slotKey) ?? drawn.get(piece.key)
        let fromEarlierGoals = 0
        const countedFrom = new Map<string, number>()
        for (const piece of pieces) {
          if (fromEarlierGoals >= need.quantity) break
          const earlier = holderOf(piece)
          if (earlier?.held !== true) continue
          counted.add(piece.key)
          fromEarlierGoals++
          countedFrom.set(
            earlier.goalId,
            (countedFrom.get(earlier.goalId) ?? 0) + 1
          )
        }
        const stillNeeded = need.quantity - fromEarlierGoals
        // Read before this goal's own draw, so the list holds only goals ahead of it.
        const takenAhead = [...(takenBy.get(id) ?? [])]
        const taken = take(goal.goalId, id, stillNeeded)
        let claimed = 0
        for (const piece of pieces) {
          if (claimed >= stillNeeded) break
          if (holderOf(piece)) continue
          drawn.set(piece.key, { held: claimed < taken, goalId: goal.goalId })
          counted.add(piece.key)
          claimed++
        }
        share.set(id, (share.get(id) ?? 0) + fromEarlierGoals + taken)

        const materialHolders = goalHolders.get(id) ?? []
        for (const [goalId, amount] of countedFrom) {
          materialHolders.push({ goalId, amount, counted: true })
        }
        if (taken < stillNeeded) {
          // Pieces already counted toward this goal aren't also "taken ahead" of it.
          for (const [goalId, amount] of takenAhead) {
            const ahead = amount - (countedFrom.get(goalId) ?? 0)
            if (ahead > 0)
              materialHolders.push({ goalId, amount: ahead, counted: false })
          }
        }
        if (materialHolders.length > 0) goalHolders.set(id, materialHolders)
      }
      result.set(
        goal.goalId,
        [...share].map(([upgradeId, amount]) => ({ upgradeId, amount }))
      )
      if (goalHolders.size > 0) holders.set(goal.goalId, goalHolders)
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
      drawn.set(item.key, {
        held: take(goal.goalId, item.id, 1) === 1,
        goalId: goal.goalId,
      })
    }
  }
  return { stock: result, holders }
}
