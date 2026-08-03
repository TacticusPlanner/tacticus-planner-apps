import {
  firstRank,
  rankIndex,
  rankOrder,
  type Rank,
} from "@workspace/game-domain"

import type {
  BaseUpgradeNeed,
  Character,
  RankUpGroup,
  UpgradeAmount,
  Upgrade,
} from "./rank-lookup.domain"
import type { UpgradeId } from "@workspace/game-domain"

export type {
  BaseUpgradeNeed,
  Character,
  RecipeIngredient,
  RankUpGroup,
  UpgradeAmount,
  Upgrade,
} from "./rank-lookup.domain"

const rankUpgradeMap = (character: Character): Map<Rank, UpgradeId[]> =>
  new Map(
    character.rankUpUpgrades.map((entry) => [entry.rank, entry.upgradeIds])
  )

/** Every rank's `upgradeIds` are ordered as 2 rows of 3 stats, interleaved
 * `[Health, Health, Damage, Damage, Armour, Armour]` — the "top row" (indices 0/2/4) is the first
 * of each stat pair. */
const topRow = (upgrades: readonly UpgradeId[]): UpgradeId[] =>
  upgrades.filter((_, index) => index % 2 === 0)

/**
 * The upgrade ids applied to take `character` from `rankStart` up to (but not including) `rankEnd`.
 * At the target rank, one of (checked in this order):
 * - `topRowCount` > 0 includes just the first N of the *top row* (Health, then + Damage, then +
 *   Armour — a below-Diamond3 rank's only independently-appliable upgrades, since its bottom row
 *   needs a further level first),
 * - `appliedUpgrades` > 0 includes just the first N upgrades in raw catalog order (V1's Mythic-tier
 *   "N of 6" partial target, Diamond3+ only — ported from `CharacterUpgradesService.
 *   getCharacterUpgradeRank`'s `lastRankUpgrades.slice(0, targetApplied)`), or
 * - `pointFive` includes the whole top row (indices 0/2/4) — V1's "Rank Point Five", equivalent to
 *   `topRowCount: 3`.
 * A same-rank range may still return its configured partial target; a clean same-rank or inverted
 * range returns `[]`.
 */
export function rankUpUpgradeIds(
  character: Character,
  rankStart: Rank,
  rankEnd: Rank,
  pointFive: boolean,
  appliedUpgrades = 0,
  topRowCount = 0
): UpgradeId[] {
  if (rankIndex(rankStart) > rankIndex(rankEnd)) return []

  const byRank = rankUpgradeMap(character)
  const ids: UpgradeId[] = []
  for (let i = rankIndex(rankStart); i < rankIndex(rankEnd); i++) {
    ids.push(...(byRank.get(rankOrder[i]) ?? []))
  }
  const endUpgrades = byRank.get(rankEnd) ?? []
  if (topRowCount > 0) {
    ids.push(...topRow(endUpgrades).slice(0, topRowCount))
  } else if (appliedUpgrades > 0) {
    ids.push(...endUpgrades.slice(0, appliedUpgrades))
  } else if (pointFive) {
    ids.push(...topRow(endUpgrades))
  }
  return ids
}

/** Per rank-step grouping for the "rank → rank" sections, plus an optional partial group at the end
 * — see `rankUpUpgradeIds` for the `pointFive`/`appliedUpgrades`/`topRowCount` semantics. */
export function groupUpgradesByRank(
  character: Character,
  rankStart: Rank,
  rankEnd: Rank,
  pointFive: boolean,
  appliedUpgrades = 0,
  topRowCount = 0
): RankUpGroup[] {
  if (rankIndex(rankStart) > rankIndex(rankEnd)) return []

  const byRank = rankUpgradeMap(character)
  const groups: RankUpGroup[] = []
  for (let i = rankIndex(rankStart); i < rankIndex(rankEnd); i++) {
    groups.push({
      fromRank: rankOrder[i],
      toRank: rankOrder[i + 1],
      upgradeIds: byRank.get(rankOrder[i]) ?? [],
    })
  }
  const endUpgrades = byRank.get(rankEnd) ?? []
  const partial =
    topRowCount > 0
      ? topRow(endUpgrades).slice(0, topRowCount)
      : appliedUpgrades > 0
        ? endUpgrades.slice(0, appliedUpgrades)
        : pointFive
          ? topRow(endUpgrades)
          : []
  if (partial.length > 0) {
    groups.push({
      fromRank: rankEnd,
      toRank: rankEnd,
      upgradeIds: partial,
      pointFive: true,
    })
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
  upgradesById: ReadonlyMap<UpgradeId, Upgrade>
): Map<UpgradeId, number> {
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

/**
 * Reduce a flat list of applied upgrade ids to the non-crafted **base** upgrades needed, summing counts.
 * Crafted upgrades are expanded through their recipe (recursively, multiplying ingredient counts);
 * base upgrades (and unknown ids) are counted directly.
 */
export function aggregateBaseUpgrades(
  upgradeIds: UpgradeId[],
  upgradesById: ReadonlyMap<UpgradeId, Upgrade>
): BaseUpgradeNeed[] {
  const counts = reduceToBaseUpgrades(
    upgradeIds.map((id) => ({ id, amount: 1 })),
    upgradesById
  )
  return [...counts.entries()].map(([id, count]) => ({ id, count }))
}

/**
 * Same reduction as `aggregateBaseUpgrades`, but for entries that already carry an explicit target
 * amount (e.g. an Upgrade goal's `{upgradeId, quantity}` targets) instead of being counted once per
 * occurrence in a flat id list — the "required, with quantities" sibling to
 * `aggregateOwnedBaseUpgrades`'s "owned, with quantities".
 */
export function aggregateBaseUpgradeAmounts(
  entries: UpgradeAmount[],
  upgradesById: ReadonlyMap<UpgradeId, Upgrade>
): BaseUpgradeNeed[] {
  const counts = reduceToBaseUpgrades(entries, upgradesById)
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
  appliedIds: UpgradeId[],
  inventoryUpgrades: UpgradeAmount[],
  upgradesById: ReadonlyMap<UpgradeId, Upgrade>
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
  character: Character,
  currentRank: Rank,
  appliedSlotIndices: readonly number[]
): UpgradeId[] {
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
