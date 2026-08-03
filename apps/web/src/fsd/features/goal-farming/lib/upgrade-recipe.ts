import {
  rankIndex,
  rankOrder,
  type Rank,
  type UpgradeId,
} from "@workspace/game-domain"

import type { FarmingCharacter, FarmingUpgrade } from "../model/estimate.domain"

type UpgradeAmount = { id: UpgradeId; amount: number }

export type CraftedInventoryPool = Map<UpgradeId, number>

const rankUpgradeMap = (character: FarmingCharacter) =>
  new Map(
    character.rankUpUpgrades.map((entry) => [entry.rank, entry.upgradeIds])
  )

const topRow = (upgrades: readonly UpgradeId[]) =>
  upgrades.filter((_, index) => index % 2 === 0)

export function rankUpUpgradeIds(
  character: FarmingCharacter,
  rankStart: Rank,
  rankEnd: Rank,
  pointFive: boolean,
  appliedUpgrades = 0,
  topRowCount = 0
): UpgradeId[] {
  if (rankIndex(rankStart) > rankIndex(rankEnd)) return []

  const byRank = rankUpgradeMap(character)
  const ids: UpgradeId[] = []
  for (let index = rankIndex(rankStart); index < rankIndex(rankEnd); index++) {
    ids.push(...(byRank.get(rankOrder[index]) ?? []))
  }
  const endUpgrades = byRank.get(rankEnd) ?? []
  if (topRowCount > 0) ids.push(...topRow(endUpgrades).slice(0, topRowCount))
  else if (appliedUpgrades > 0)
    ids.push(...endUpgrades.slice(0, appliedUpgrades))
  else if (pointFive) ids.push(...topRow(endUpgrades))
  return ids
}

function reduceToBaseUpgrades(
  entries: UpgradeAmount[],
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>,
  craftedInventory?: CraftedInventoryPool
) {
  const counts = new Map<UpgradeId, number>()
  const add = (
    id: UpgradeId,
    multiplier: number,
    expansionPath: Set<UpgradeId>
  ) => {
    if (expansionPath.has(id)) return
    const upgrade = upgradesById.get(id)
    if (upgrade?.crafted && upgrade.recipe.length > 0) {
      const available = craftedInventory?.get(id) ?? 0
      const consumed = Math.min(available, multiplier)
      if (consumed > 0) craftedInventory!.set(id, available - consumed)
      const remaining = multiplier - consumed
      if (remaining <= 0) return

      expansionPath.add(id)
      for (const ingredient of upgrade.recipe) {
        add(ingredient.material, remaining * ingredient.count, expansionPath)
      }
      expansionPath.delete(id)
    } else {
      counts.set(id, (counts.get(id) ?? 0) + multiplier)
    }
  }
  for (const entry of entries) add(entry.id, entry.amount, new Set())
  return counts
}

export function createCraftedInventoryPool(
  inventoryUpgrades: readonly { upgradeId: string; amount: number }[],
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
): CraftedInventoryPool {
  const pool: CraftedInventoryPool = new Map()
  for (const entry of inventoryUpgrades) {
    const id = entry.upgradeId as UpgradeId
    const upgrade = upgradesById.get(id)
    if (!upgrade?.crafted || upgrade.recipe.length === 0 || entry.amount <= 0)
      continue
    pool.set(id, (pool.get(id) ?? 0) + entry.amount)
  }
  return pool
}

export function aggregateBaseUpgradesWithCraftedInventory(
  upgradeIds: UpgradeId[],
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>,
  craftedInventory: CraftedInventoryPool
) {
  return [
    ...reduceToBaseUpgrades(
      upgradeIds.map((id) => ({ id, amount: 1 })),
      upgradesById,
      craftedInventory
    ),
  ].map(([id, count]) => ({ id, count }))
}

export function removeUpgradeOccurrences(
  requiredIds: UpgradeId[],
  appliedIds: readonly UpgradeId[]
): UpgradeId[] {
  const remainingApplied = new Map<UpgradeId, number>()
  for (const id of appliedIds) {
    remainingApplied.set(id, (remainingApplied.get(id) ?? 0) + 1)
  }
  return requiredIds.filter((id) => {
    const applied = remainingApplied.get(id) ?? 0
    if (applied <= 0) return true
    remainingApplied.set(id, applied - 1)
    return false
  })
}

export function aggregateBaseUpgrades(
  upgradeIds: UpgradeId[],
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
) {
  return [
    ...reduceToBaseUpgrades(
      upgradeIds.map((id) => ({ id, amount: 1 })),
      upgradesById
    ),
  ].map(([id, count]) => ({ id, count }))
}

export function aggregateOwnedBaseUpgrades(
  appliedIds: UpgradeId[],
  inventoryUpgrades: UpgradeAmount[],
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
) {
  return [
    ...reduceToBaseUpgrades(
      [...appliedIds.map((id) => ({ id, amount: 1 })), ...inventoryUpgrades],
      upgradesById
    ),
  ].map(([id, count]) => ({ id, count }))
}
