import type { Rarity } from "@workspace/game-domain"
import { rarityRank } from "@workspace/game-domain"

import { firstDifference } from "../lib"

/** One level's price on an item's upgrade ladder (the catalog's `upgradeLevels[]`). Level 1's entry
 *  carries no gold: its salvage is what the item is worth when found. */
export type ItemLadderStep = {
  goldCost: number
  salvageCost: number
  mythicSalvageCost: number
}

/** What these helpers read of a catalog equipment record. */
export type LadderItem = {
  rarity: Rarity
  levels: readonly { stats: Readonly<Record<string, number>> }[]
  upgradeLevels: readonly ItemLadderStep[]
}

/** Gold, salvage and Mythic salvage, summed. */
export type ItemCost = { gold: number; salvage: number; mythicSalvage: number }

const ZERO: ItemCost = { gold: 0, salvage: 0, mythicSalvage: 0 }

/** The highest level an item reaches. */
export function maxItemLevel(item: LadderItem): number {
  return item.levels.length
}

/** A level clamped to the item's ladder (1 … max). */
export function clampItemLevel(item: LadderItem, level: number): number {
  return Math.min(
    Math.max(1, Math.trunc(level)),
    Math.max(1, maxItemLevel(item))
  )
}

/** The item's stats at a level (the served stat names, e.g. `critChance`, `critDamage`). */
export function itemStatsAt(
  item: LadderItem,
  level: number
): Readonly<Record<string, number>> {
  return item.levels[clampItemLevel(item, level) - 1]?.stats ?? {}
}

function sumSteps(steps: readonly ItemLadderStep[]): ItemCost {
  return steps.reduce<ItemCost>(
    (total, step) => ({
      gold: total.gold + step.goldCost,
      salvage: total.salvage + step.salvageCost,
      mythicSalvage: total.mythicSalvage + step.mythicSalvageCost,
    }),
    ZERO
  )
}

/** What it costs to upgrade an item from one level to another (nothing when `to` is not higher):
 *  the ladder steps of every level above `from` up to `to`. */
export function upgradeCost(
  item: LadderItem,
  from: number,
  to: number
): ItemCost {
  const start = clampItemLevel(item, from)
  const end = clampItemLevel(item, to)
  if (end <= start) return ZERO
  return sumSteps(item.upgradeLevels.slice(start, end))
}

/**
 * What one copy returns when reclaimed, as the game's Reclaim items screen pays it: the salvage it
 * is worth at level 1 plus the salvage spent upgrading it, and the gold spent upgrading it (the game
 * refunds both in full: `dustRefundPct` and `itemGoldRefundPct` are 100). Mythic items pay Mythic
 * salvage instead, the same way. An Epic item at level 3 returns 150 + 90 + 120 = 360 salvage.
 */
export function reclaimValue(item: LadderItem, level: number): ItemCost {
  return sumSteps(item.upgradeLevels.slice(0, clampItemLevel(item, level)))
}

/** Adds two costs. */
export function addCosts(a: ItemCost, b: ItemCost): ItemCost {
  return {
    gold: a.gold + b.gold,
    salvage: a.salvage + b.salvage,
    mythicSalvage: a.mythicSalvage + b.mythicSalvage,
  }
}

/** A cost times a count of copies. */
export function scaleCost(cost: ItemCost, count: number): ItemCost {
  return {
    gold: cost.gold * count,
    salvage: cost.salvage * count,
    mythicSalvage: cost.mythicSalvage * count,
  }
}

export const NO_COST: ItemCost = ZERO

/** Whether a stat is a percentage (the chance stats) rather than a flat value. */
export function isPercentStat(stat: string): boolean {
  return stat.includes("Chance")
}

/** The item's hit chance at a level: crit or block chance, or a booster's chance bonus; 0 for a
 *  Defensive item, which has none. */
export function itemChanceAt(item: LadderItem, level: number): number {
  const stats = itemStatsAt(item, level)
  return (
    stats.critChance ??
    stats.blockChance ??
    stats.critChanceBonus ??
    stats.blockChanceBonus ??
    0
  )
}

/** Highest rarity first, then the higher level: the order the game lists items in. */
export function compareByRarityThenLevel(
  a: { rarity: Rarity; level: number },
  b: { rarity: Rarity; level: number }
): number {
  return firstDifference(
    rarityRank(b.rarity) - rarityRank(a.rarity),
    b.level - a.level
  )
}
