import type {
  CharacterAbilityCostStorageModel,
  MowUpgradeCostStorageModel,
} from "@workspace/game-catalog"

import type { Rarity } from "@workspace/game-domain"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import type { GoalDetail } from "@/entities/goal"
import {
  abilityMaterialsNeed,
  createUnitCoverage,
  mowAbilityTrackLevel,
  type AbilityMaterials,
  type UnitCoverage,
} from "@/features/goal-farming"

type Player = Parameters<typeof mowAbilityTrackLevel>[0]

/** Ability cost ladders keyed by the level a rung raises an ability to. */
export type AbilityLadders = {
  mowUpgradeCostsByLevel?: ReadonlyMap<number, MowUpgradeCostStorageModel>
  characterAbilityCostsByLevel?: ReadonlyMap<
    number,
    CharacterAbilityCostStorageModel
  >
}

/** The account's owned ability badges (by alliance), forge badges and MoW components. */
export type AbilityInventory = Pick<
  PlayerDataChunkDto<"inventory">,
  "abilityBadges" | "forgeBadges" | "components"
>

const ALLIANCES = ["imperial", "xenos", "chaos"] as const

/** One shared stock keyed like `badge:xenos:Legendary`, `forge:Epic`, `component:chaos`. */
function stockOf(inventory: AbilityInventory) {
  const stock = new Map<string, number>()
  for (const alliance of ALLIANCES) {
    for (const entry of inventory.abilityBadges?.[alliance] ?? []) {
      stock.set(`badge:${alliance}:${entry.rarity}`, entry.amount)
    }
    stock.set(
      `component:${alliance}`,
      inventory.components?.[alliance]?.amount ?? 0
    )
  }
  for (const entry of inventory.forgeBadges ?? []) {
    stock.set(`forge:${entry.rarity}`, entry.amount)
  }
  return stock
}

/** Spends the shared stock on one goal's materials and returns what is still needed (gold is never
 *  netted). `null` when nothing but zero gold is left. */
function netAgainstStock(
  materials: AbilityMaterials,
  stock: Map<string, number>,
  alliance: string | undefined
): AbilityMaterials | null {
  const take = (key: string, need: number) => {
    const used = Math.min(stock.get(key) ?? 0, need)
    stock.set(key, (stock.get(key) ?? 0) - used)
    return need - used
  }
  const lower = alliance?.toLowerCase()
  const byRarity = (
    amounts: Partial<Record<Rarity, number>>,
    keyOf: (rarity: Rarity) => string | undefined
  ) => {
    const left: Partial<Record<Rarity, number>> = {}
    for (const [rarity, need] of Object.entries(amounts) as [
      Rarity,
      number,
    ][]) {
      const key = keyOf(rarity)
      const remaining = key ? take(key, need) : need
      if (remaining > 0) left[rarity] = remaining
    }
    return left
  }
  const net: AbilityMaterials = {
    gold: materials.gold,
    badgesByRarity: byRarity(
      materials.badgesByRarity,
      (rarity) => lower && `badge:${lower}:${rarity}`
    ),
    forgeBadgesByRarity: byRarity(
      materials.forgeBadgesByRarity,
      (rarity) => `forge:${rarity}`
    ),
    components: lower
      ? take(`component:${lower}`, materials.components)
      : materials.components,
  }
  const empty =
    net.gold === 0 &&
    net.components === 0 &&
    Object.keys(net.badgesByRarity).length === 0 &&
    Object.keys(net.forgeBadgesByRarity).length === 0
  return empty ? null : net
}

/** Allocates Ability materials across the plan: call `add` per goal in priority order and each Ability
 *  goal gets only the levels no higher-priority goal for the same unit already claimed (`null` when
 *  nothing is left). With `inventory`, the owned badges/forge badges/components are also one shared
 *  pool spent in that same order (a higher-priority goal takes stock first). Kept apart from the
 *  farming need so the chips never change the plan's estimates. */
export function createAbilityMaterialsPlan(
  ladders: AbilityLadders = {},
  inventory?: AbilityInventory
) {
  const stock = inventory ? stockOf(inventory) : undefined
  const coverageByEntity = new Map<string, UnitCoverage>()
  const byGoalId = new Map<string, AbilityMaterials | null>()
  const add = (
    detail: GoalDetail,
    {
      playerCharacter,
      playerMow,
      alliance,
    }: { playerCharacter: Player; playerMow: Player; alliance?: string }
  ) => {
    if (detail.goalType !== "Ability") return
    const isMow = detail.entityType === "Mow"
    const unit = isMow ? playerMow : playerCharacter
    const covered =
      coverageByEntity.get(detail.entityId) ?? createUnitCoverage()
    coverageByEntity.set(detail.entityId, covered)
    const materials = abilityMaterialsNeed({
      detail,
      ladder: isMow
        ? ladders.mowUpgradeCostsByLevel
        : ladders.characterAbilityCostsByLevel,
      currentLevels: {
        primary: mowAbilityTrackLevel(unit, "primary"),
        secondary: mowAbilityTrackLevel(unit, "secondary"),
      },
      covered,
      claim: true,
    })
    byGoalId.set(
      detail.goalId,
      materials && stock
        ? netAgainstStock(materials, stock, alliance)
        : materials
    )
  }
  return { add, byGoalId }
}
