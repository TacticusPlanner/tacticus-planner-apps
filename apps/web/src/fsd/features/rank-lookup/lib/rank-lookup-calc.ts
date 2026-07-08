import {
  firstRank,
  rankIndex,
  rankOrder,
  type Rank,
} from "@workspace/game-catalog"

import type {
  BaseUpgradeNeed,
  CharacterLike,
  RankUpGroup,
  UpgradeAmount,
  UpgradeLike,
} from "./rank-lookup-calc.types"

export type {
  BaseUpgradeNeed,
  CharacterLike,
  RecipeIngredient,
  RankUpGroup,
  UpgradeAmount,
  UpgradeLike,
} from "./rank-lookup-calc.types"

const rankUpgradeMap = (character: CharacterLike): Map<string, string[]> =>
  new Map(
    character.rankUpUpgrades.map((entry) => [entry.rank, entry.upgradeIds])
  )

/**
 * The upgrade ids applied to take `character` from `rankStart` up to (but not including) `rankEnd`. When
 * `pointFive` is set, also include the immediately-applicable upgrades at the target rank — the first of
 * each stat pair (indices 0/2/4). Returns `[]` for an empty/invalid range.
 */
export function rankUpUpgradeIds(
  character: CharacterLike,
  rankStart: Rank,
  rankEnd: Rank,
  pointFive: boolean
): string[] {
  if (rankIndex(rankStart) >= rankIndex(rankEnd)) return []

  const byRank = rankUpgradeMap(character)
  const ids: string[] = []
  for (let i = rankIndex(rankStart); i < rankIndex(rankEnd); i++) {
    ids.push(...(byRank.get(rankOrder[i]) ?? []))
  }
  if (pointFive) {
    const endUpgrades = byRank.get(rankEnd) ?? []
    ids.push(...endUpgrades.filter((_, index) => index % 2 === 0))
  }
  return ids
}

/** Per rank-step grouping for the "rank → rank" sections, plus an optional point-five group at the end. */
export function groupUpgradesByRank(
  character: CharacterLike,
  rankStart: Rank,
  rankEnd: Rank,
  pointFive: boolean
): RankUpGroup[] {
  if (rankIndex(rankStart) >= rankIndex(rankEnd)) return []

  const byRank = rankUpgradeMap(character)
  const groups: RankUpGroup[] = []
  for (let i = rankIndex(rankStart); i < rankIndex(rankEnd); i++) {
    groups.push({
      fromRank: rankOrder[i],
      toRank: rankOrder[i + 1],
      upgradeIds: byRank.get(rankOrder[i]) ?? [],
    })
  }
  if (pointFive) {
    const point5 = (byRank.get(rankEnd) ?? []).filter(
      (_, index) => index % 2 === 0
    )
    if (point5.length > 0) {
      groups.push({
        fromRank: rankEnd,
        toRank: rankEnd,
        upgradeIds: point5,
        pointFive: true,
      })
    }
  }
  return groups
}

/**
 * Shared reducer behind both `aggregateBaseUpgrades` (each input counted once) and
 * `aggregateOwnedBaseUpgrades` (each input counted by its owned amount): expands crafted upgrades
 * through their recipe (recursively, multiplying ingredient counts by the incoming amount); base
 * upgrades (and unknown ids) are counted directly. Keeping this in one place means "required" and
 * "owned" totals are always reduced to base-upgrade ids the same way, so they stay comparable.
 */
function reduceToBaseUpgrades(
  entries: UpgradeAmount[],
  upgradesById: ReadonlyMap<string, UpgradeLike>
): Map<string, number> {
  const counts = new Map<string, number>()

  const add = (id: string, multiplier: number) => {
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

/**
 * Reduce a flat list of applied upgrade ids to the non-crafted **base** upgrades needed, summing counts.
 * Crafted upgrades are expanded through their recipe (recursively, multiplying ingredient counts);
 * base upgrades (and unknown ids) are counted directly.
 */
export function aggregateBaseUpgrades(
  upgradeIds: string[],
  upgradesById: ReadonlyMap<string, UpgradeLike>
): BaseUpgradeNeed[] {
  const counts = reduceToBaseUpgrades(
    upgradeIds.map((id) => ({ id, amount: 1 })),
    upgradesById
  )
  return [...counts.entries()].map(([id, count]) => ({ id, count }))
}

/**
 * The base-upgrade totals a player already "has" toward a rank-up: upgrades already applied to the
 * character (counted once each — see `appliedUpgradeIds`) plus everything sitting in their inventory,
 * both base materials and already-crafted higher-tier upgrades (counted by owned amount). Reduced
 * through the same crafted-recipe expansion as `aggregateBaseUpgrades` so the two totals are directly
 * comparable at the same (base-upgrade) granularity.
 */
export function aggregateOwnedBaseUpgrades(
  appliedIds: string[],
  inventoryUpgrades: UpgradeAmount[],
  upgradesById: ReadonlyMap<string, UpgradeLike>
): BaseUpgradeNeed[] {
  const counts = reduceToBaseUpgrades(
    [...appliedIds.map((id) => ({ id, amount: 1 })), ...inventoryUpgrades],
    upgradesById
  )
  return [...counts.entries()].map(([id, count]) => ({ id, count }))
}

/**
 * Upgrade ids already applied to `character`, given its actual synced `currentRank` and the indices
 * of already-filled slots at that rank (partial progress toward the next rank). Every upgrade for
 * ranks strictly below `currentRank` is included unconditionally — reaching a rank requires having
 * applied all of the previous rank's upgrades — via the same `rankUpUpgradeIds` used for the
 * "required" side. `appliedSlotIndices` then selects which of `currentRank`'s own (not-yet-promoted)
 * upgrades are already filled in, by position — mirrors the point-five filter's index convention
 * (each rank's `upgradeIds` is ordered `[Health, Health, Damage, Damage, Armour, Armour]`).
 */
export function appliedUpgradeIds(
  character: CharacterLike,
  currentRank: Rank,
  appliedSlotIndices: readonly number[]
): string[] {
  const byRank = rankUpgradeMap(character)
  const ids = rankUpUpgradeIds(character, firstRank, currentRank, false)
  const currentRankUpgrades = byRank.get(currentRank) ?? []
  ids.push(
    ...currentRankUpgrades.filter((_, index) =>
      appliedSlotIndices.includes(index)
    )
  )
  return ids
}
