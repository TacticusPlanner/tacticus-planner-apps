import { rankIndex, rankOrder, type RankId } from "@workspace/game-catalog"

import type {
  BaseUpgradeNeed,
  CharacterLike,
  RankUpGroup,
  UpgradeLike,
} from "./rank-lookup-calc.types"

export type {
  BaseUpgradeNeed,
  CharacterLike,
  RecipeIngredient,
  RankUpEntry,
  RankUpGroup,
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
  rankStart: RankId,
  rankEnd: RankId,
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
  rankStart: RankId,
  rankEnd: RankId,
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
 * Reduce a flat list of applied upgrade ids to the non-composite **base** upgrades needed, summing counts.
 * Composite upgrades are expanded through their recipe (recursively, multiplying ingredient counts);
 * base upgrades (and unknown ids) are counted directly.
 */
export function aggregateBaseUpgrades(
  upgradeIds: string[],
  upgradesById: ReadonlyMap<string, UpgradeLike>
): BaseUpgradeNeed[] {
  const counts = new Map<string, number>()

  const add = (id: string, multiplier: number) => {
    const upgrade = upgradesById.get(id)
    if (upgrade?.composite && upgrade.recipe.length > 0) {
      for (const ingredient of upgrade.recipe) {
        add(ingredient.material, multiplier * ingredient.count)
      }
    } else {
      counts.set(id, (counts.get(id) ?? 0) + multiplier)
    }
  }

  for (const id of upgradeIds) add(id, 1)

  return [...counts.entries()].map(([id, count]) => ({ id, count }))
}
