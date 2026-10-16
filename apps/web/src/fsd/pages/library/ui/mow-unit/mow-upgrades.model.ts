import {
  rarityRank,
  type Alliance,
  type Rarity,
  type UpgradeId,
} from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import { mowAbilityUpgradeIds } from "@/features/goal-farming"
import {
  aggregateBaseUpgrades,
  aggregateOwnedBaseUpgrades,
  type UpgradeWithFarmLocations,
} from "@/features/rank-lookup"

export type MowAbility = "primary" | "secondary"

export const MOW_ABILITIES: readonly MowAbility[] = ["primary", "secondary"]

/** An ability's level range: raising it from `from` to `to` (`to` ≥ `from`; equal adds nothing). */
export type MowLevelRange = { from: number; to: number }

export type MowLevelRanges = Record<MowAbility, MowLevelRange>

type RarityAmount = { rarity: Rarity; amount: number }

/** One rung of the shared MoW upgrade-cost ladder: what reaching `level` costs. */
export type MowCostRung = {
  level: number
  gold: number
  salvage: number
  badges: RarityAmount
  forgeBadges?: RarityAmount | null
  components: number
}

/** Raising one ability by one level: the ladder rung for the level reached and that step's recipe. */
type MowUpgradeStep = {
  ability: MowAbility
  from: number
  to: number
  gold: number
  salvage: number
  components: number
  badges?: RarityAmount
  forgeBadges?: RarityAmount
  recipe: UpgradeId[]
}

type MowUpgradeTotals = {
  gold: number
  salvage: number
  components: number
  badges: Partial<Record<Rarity, number>>
  forgeBadges: Partial<Record<Rarity, number>>
}

/** A base material the range consumes: how many it needs, how many the inventory covers, and the rest. */
type MowMaterialLine = {
  id: UpgradeId
  label: string
  rarity: Rarity | undefined
  needed: number
  owned: number
  remaining: number
}

/** What the inventory holds towards a MoW's upgrades (badges and components of its alliance). */
export type MowOwnedStock = {
  badges: Partial<Record<Rarity, number>>
  forgeBadges: Partial<Record<Rarity, number>>
  components: number
  upgrades: readonly { id: UpgradeId; amount: number }[]
}

export type MowUpgradesResult = {
  /** Primary steps, then Secondary steps, each in level order. */
  steps: MowUpgradeStep[]
  /** What the range costs. */
  needed: MowUpgradeTotals
  /** `needed` minus the owned stock, floored at 0 (equal to `needed` without stock). */
  remaining: MowUpgradeTotals
  /** Base materials (crafted ones broken down), highest rarity first, then by count. */
  materials: MowMaterialLine[]
}

/**
 * The Ability upgrades calculation (V1's MoW Lookup): every level step in each ability's range, with
 * the ladder rung for the level it reaches and the ability's recipe for that step. Totals, materials
 * and the per-level table all derive from `steps`, so they can't disagree.
 */
export function calculateMowUpgrades({
  recipes,
  costsByLevel,
  upgradesById,
  ranges,
  owned,
}: {
  recipes: Record<MowAbility, readonly UpgradeId[][]>
  costsByLevel: ReadonlyMap<number, MowCostRung>
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  ranges: MowLevelRanges
  owned?: MowOwnedStock
}): MowUpgradesResult {
  const steps: MowUpgradeStep[] = []
  for (const ability of MOW_ABILITIES) {
    const { from, to } = ranges[ability]
    for (let level = from; level < to; level++) {
      const rung = costsByLevel.get(level + 1)
      steps.push({
        ability,
        from: level,
        to: level + 1,
        gold: rung?.gold ?? 0,
        salvage: rung?.salvage ?? 0,
        components: rung?.components ?? 0,
        badges: rung && rung.badges.amount > 0 ? rung.badges : undefined,
        forgeBadges:
          rung?.forgeBadges && rung.forgeBadges.amount > 0
            ? rung.forgeBadges
            : undefined,
        recipe: mowAbilityUpgradeIds(recipes[ability], level, level + 1),
      })
    }
  }

  const needed: MowUpgradeTotals = {
    gold: 0,
    salvage: 0,
    components: 0,
    badges: {},
    forgeBadges: {},
  }
  for (const step of steps) {
    needed.gold += step.gold
    needed.salvage += step.salvage
    needed.components += step.components
    if (step.badges) addRarity(needed.badges, step.badges)
    if (step.forgeBadges) addRarity(needed.forgeBadges, step.forgeBadges)
  }

  const remaining: MowUpgradeTotals = owned
    ? {
        gold: needed.gold,
        salvage: needed.salvage,
        components: Math.max(0, needed.components - owned.components),
        badges: subtractRarities(needed.badges, owned.badges),
        forgeBadges: subtractRarities(needed.forgeBadges, owned.forgeBadges),
      }
    : needed

  const ownedById = new Map(
    owned
      ? aggregateOwnedBaseUpgrades([], [...owned.upgrades], upgradesById).map(
          (entry) => [entry.id, entry.count]
        )
      : []
  )
  const materials = aggregateBaseUpgrades(
    steps.flatMap((step) => step.recipe),
    upgradesById
  )
    .map(({ id, count }): MowMaterialLine => {
      const upgrade = upgradesById.get(id)
      const have = Math.min(count, ownedById.get(id) ?? 0)
      return {
        id,
        label: upgrade?.label ?? id,
        rarity: upgrade?.rarity,
        needed: count,
        owned: have,
        remaining: count - have,
      }
    })
    .sort(
      (a, b) =>
        rarityOf(b) - rarityOf(a) ||
        b.needed - a.needed ||
        a.label.localeCompare(b.label)
    )

  return { steps, needed, remaining, materials }
}

function rarityOf(line: MowMaterialLine): number {
  return line.rarity ? rarityRank(line.rarity) : -1
}

function addRarity(into: Partial<Record<Rarity, number>>, entry: RarityAmount) {
  into[entry.rarity] = (into[entry.rarity] ?? 0) + entry.amount
}

function subtractRarities(
  needed: Partial<Record<Rarity, number>>,
  owned: Partial<Record<Rarity, number>>
): Partial<Record<Rarity, number>> {
  const result: Partial<Record<Rarity, number>> = {}
  for (const [rarity, amount] of Object.entries(needed) as [Rarity, number][]) {
    result[rarity] = Math.max(0, amount - (owned[rarity] ?? 0))
  }
  return result
}

/**
 * The inventory's stock towards a MoW's upgrades: badges and components of the MoW's alliance, forge
 * badges (shared by every alliance), and upgrade materials.
 */
export function ownedMowStock(
  inventory: Pick<
    PlayerDataChunkDto<"inventory">,
    "abilityBadges" | "forgeBadges" | "components"
  >,
  inventoryUpgrades: PlayerDataChunkDto<"inventory-upgrades">,
  alliance: Alliance
): MowOwnedStock {
  const key = alliance.toLowerCase() as "imperial" | "xenos" | "chaos"
  const byRarity = (entries: readonly RarityAmount[] | undefined) => {
    const result: Partial<Record<Rarity, number>> = {}
    for (const entry of entries ?? []) addRarity(result, entry)
    return result
  }
  return {
    badges: byRarity(inventory.abilityBadges[key]),
    forgeBadges: byRarity(inventory.forgeBadges),
    components: inventory.components[key]?.amount ?? 0,
    upgrades: inventoryUpgrades.map((entry) => ({
      id: entry.upgradeId,
      amount: entry.amount,
    })),
  }
}

/** The default range for an ability: From = the player's level (or 1), To = From + 10, capped. */
export function defaultMowRange(from: number, max: number): MowLevelRange {
  const start = Math.min(Math.max(1, from), max)
  return { from: start, to: Math.min(start + 10, max) }
}

/** A range with a new From: To is raised to From when it would fall below it. */
export function withFrom(range: MowLevelRange, from: number): MowLevelRange {
  return { from, to: Math.max(range.to, from) }
}
