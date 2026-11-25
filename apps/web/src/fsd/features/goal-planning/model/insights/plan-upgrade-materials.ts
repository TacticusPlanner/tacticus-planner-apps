import { rarityOrder } from "@workspace/game-domain"
import type { Rarity, UpgradeId } from "@workspace/game-domain"

import type { EstimateResourceId, GoalNeed } from "@/entities/goal-farming"
import type { UpgradeWithFarmLocations } from "@/entities/rank-lookup"

import type {
  PlanSpareUpgrade,
  PlanUpgradeMaterial,
} from "./use-plan-insights.domain"

/**
 * Insights' farmed upgrades one by one (idea: Missing / Required / Spare). For the scoped goals, each
 * base upgrade material's `required` amount (the goals' need before base stock is spent; owned
 * crafted upgrades already count, as in Missing) beside what is still `missing` once stock and
 * suppliers are spent, with the energy and days left to farm it. `spare` is owned minus what every
 * active goal requires, so an item another project needs is never spare. Highest rarity first, then
 * the slowest to farm, then by name.
 */
type GoalUpgradeNeeds = {
  requiredScoped: Map<UpgradeId, number>
  requiredAll: Map<UpgradeId, number>
  goalIdsById: Map<UpgradeId, Set<string>>
}

const rank = (rarity: Rarity) => rarityOrder.indexOf(rarity)

const addTo = <K>(map: Map<K, number>, key: K, amount: number) => {
  map.set(key, (map.get(key) ?? 0) + amount)
}

function sumGoalUpgradeNeeds(
  goalNeeds: readonly GoalNeed[],
  inScope: (goalId: string) => boolean,
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
): GoalUpgradeNeeds {
  const result: GoalUpgradeNeeds = {
    requiredScoped: new Map(),
    requiredAll: new Map(),
    goalIdsById: new Map(),
  }
  for (const goal of goalNeeds) {
    const scoped = inScope(goal.goalId)
    for (const need of goal.needs) {
      const id = need.id as UpgradeId
      if (!upgradesById.has(id) || need.count <= 0) continue
      addTo(result.requiredAll, id, need.count)
      if (!scoped) continue
      addTo(result.requiredScoped, id, need.count)
      const goalIds = result.goalIdsById.get(id) ?? new Set<string>()
      goalIds.add(goal.goalId)
      result.goalIdsById.set(id, goalIds)
    }
  }
  return result
}

export function computePlanUpgradeMaterials(params: {
  goalNeeds: readonly GoalNeed[]
  inScope: (goalId: string) => boolean
  missingById: ReadonlyMap<EstimateResourceId, number>
  costsById: ReadonlyMap<
    EstimateResourceId,
    { energyToClear: number; days: number }
  >
  upgradesById: ReadonlyMap<UpgradeId, UpgradeWithFarmLocations>
  inventoryUpgrades: readonly { upgradeId: string; amount: number }[]
}): { upgrades: PlanUpgradeMaterial[]; spareUpgrades: PlanSpareUpgrade[] } {
  const { requiredScoped, requiredAll, goalIdsById } = sumGoalUpgradeNeeds(
    params.goalNeeds,
    params.inScope,
    params.upgradesById
  )
  const owned = new Map<UpgradeId, number>()
  for (const entry of params.inventoryUpgrades) {
    addTo(owned, entry.upgradeId as UpgradeId, entry.amount)
  }

  const upgrades: PlanUpgradeMaterial[] = []
  for (const [id, required] of requiredScoped) {
    const upgrade = params.upgradesById.get(id)
    if (!upgrade) continue
    const cost = params.costsById.get(id)
    upgrades.push({
      id,
      label: upgrade.label,
      rarity: upgrade.rarity,
      required,
      missing: params.missingById.get(id) ?? 0,
      energyToClear: cost?.energyToClear ?? 0,
      days: cost?.days ?? 0,
      goalIds: [...(goalIdsById.get(id) ?? [])],
    })
  }
  upgrades.sort((a, b) => {
    const byRarity = rank(b.rarity) - rank(a.rarity)
    if (byRarity !== 0) return byRarity
    if (a.days !== b.days) return b.days - a.days
    return a.label.localeCompare(b.label)
  })

  const spareUpgrades: PlanSpareUpgrade[] = []
  for (const [id, amount] of owned) {
    const upgrade = params.upgradesById.get(id)
    // Owned crafted upgrades are spent through the crafting pool, not counted per id here.
    if (!upgrade || upgrade.crafted) continue
    const spare = amount - (requiredAll.get(id) ?? 0)
    if (spare <= 0) continue
    spareUpgrades.push({
      id,
      label: upgrade.label,
      rarity: upgrade.rarity,
      spare,
    })
  }
  spareUpgrades.sort((a, b) => {
    const byRarity = rank(b.rarity) - rank(a.rarity)
    if (byRarity !== 0) return byRarity
    if (a.spare !== b.spare) return b.spare - a.spare
    return a.label.localeCompare(b.label)
  })
  return { upgrades, spareUpgrades }
}
