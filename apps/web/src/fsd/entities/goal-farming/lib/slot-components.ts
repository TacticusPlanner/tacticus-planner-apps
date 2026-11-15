import type { UpgradeId } from "@workspace/game-domain"

import type { FarmingUpgrade } from "../model/estimate.domain"
import {
  aggregateBaseUpgrades,
  aggregateBaseUpgradesWithCraftedInventory,
  type CraftedInventoryPool,
} from "./upgrade-recipe"

/** A slot a goal fills: its coverage key and the upgrade it takes. */
type Slot = { key: string; id: UpgradeId }

/** The coverage key of one piece of base material `id` inside a slot's recipe: the `unit`-th of the
 *  pieces that slot needs. An Upgrade goal claims these, so a Rank or Ability goal on the same unit
 *  charges only the pieces nobody claimed. */
const slotComponentKey = (slotKey: string, id: UpgradeId, unit: number) =>
  `${slotKey}>${id}#${unit}`

/** One piece of an Upgrade goal's target inside a range slot: the slot itself when its item is the
 *  target (then `key` is `slotKey`), otherwise one base piece of a crafted slot. */
type TargetUnit = { slotKey: string; key: string }

/** How many pieces of each base material one upgrade expands to. */
function baseComponents(
  id: UpgradeId,
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
): ReadonlyMap<UpgradeId, number> {
  return new Map(
    aggregateBaseUpgrades([id], upgradesById).map((entry) => [
      entry.id,
      entry.count,
    ])
  )
}

/**
 * The pieces of `targetId` an Upgrade goal can claim in `slots`, in slot order: the slot itself when it
 * holds the target, or each piece of the target in a crafted slot's base recipe (a base Engram
 * Neurochip inside a Diamond slot's crafted item). Slots that don't use the target yield nothing.
 */
export function targetUnitsInSlots(
  slots: readonly Slot[],
  targetId: UpgradeId,
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
): TargetUnit[] {
  const units: TargetUnit[] = []
  for (const slot of slots) {
    if (slot.id === targetId) {
      units.push({ slotKey: slot.key, key: slot.key })
      continue
    }
    const count = baseComponents(slot.id, upgradesById).get(targetId) ?? 0
    for (let unit = 0; unit < count; unit++)
      units.push({
        slotKey: slot.key,
        key: slotComponentKey(slot.key, targetId, unit),
      })
  }
  return units
}

/**
 * The base materials `slots` still need, net of the base pieces an Upgrade goal already claimed in
 * `claimed`. A slot with no claimed piece is charged by its own item, so owned crafted items
 * (`craftedInventory`, drained in place) still fill it; a slot with claimed pieces is charged only its
 * unclaimed base pieces.
 */
export function slotsBaseNeed(
  slots: readonly Slot[],
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>,
  claimed: ReadonlySet<string> | undefined,
  craftedInventory?: CraftedInventoryPool
): { id: UpgradeId; count: number }[] {
  const wholeIds: UpgradeId[] = []
  const partial = new Map<UpgradeId, number>()
  for (const slot of slots) {
    const components = claimed?.size
      ? baseComponents(slot.id, upgradesById)
      : undefined
    let anyClaimed = false
    const remaining: [UpgradeId, number][] = []
    for (const [id, count] of components ?? []) {
      let left = count
      for (let unit = 0; unit < count; unit++)
        if (claimed?.has(slotComponentKey(slot.key, id, unit))) {
          anyClaimed = true
          left--
        }
      remaining.push([id, left])
    }
    if (!anyClaimed) {
      wholeIds.push(slot.id)
      continue
    }
    for (const [id, left] of remaining)
      if (left > 0) partial.set(id, (partial.get(id) ?? 0) + left)
  }
  const whole = craftedInventory
    ? aggregateBaseUpgradesWithCraftedInventory(
        wholeIds,
        upgradesById,
        craftedInventory
      )
    : aggregateBaseUpgrades(wholeIds, upgradesById)
  const counts = new Map(whole.map((entry) => [entry.id, entry.count]))
  for (const [id, count] of partial)
    counts.set(id, (counts.get(id) ?? 0) + count)
  return [...counts].map(([id, count]) => ({ id, count }))
}
