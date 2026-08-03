import {
  rankIndex,
  rankOrder,
  type Rank,
  type UpgradeId,
} from "@workspace/game-domain"

import type { FarmingCharacter, FarmingUpgrade } from "../model/estimate.domain"

type UpgradeAmount = { id: UpgradeId; amount: number }

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
  upgradesById: ReadonlyMap<UpgradeId, FarmingUpgrade>
) {
  const counts = new Map<UpgradeId, number>()
  const add = (id: UpgradeId, multiplier: number) => {
    const upgrade = upgradesById.get(id)
    if (upgrade?.crafted && upgrade.recipe.length > 0) {
      for (const ingredient of upgrade.recipe) {
        add(ingredient.material, multiplier * ingredient.count)
      }
    } else {
      counts.set(id, (counts.get(id) ?? 0) + multiplier)
    }
  }
  for (const entry of entries) add(entry.id, entry.amount)
  return counts
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
