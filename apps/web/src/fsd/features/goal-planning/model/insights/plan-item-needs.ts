import type { UpgradeId } from "@workspace/game-domain"

import type { CraftedInventoryPool } from "@/entities/goal-farming"

import type {
  PlanUpgradeMaterial,
  PlanUpgradeNeed,
} from "./use-plan-insights.domain"

/**
 * Follows the plan's one shared crafted-stock pool goal by goal (`begin` before a goal's need is
 * worked out, `end` after): what each scoped goal asked of every crafted item (the pool's `demand`,
 * so it must track demand) and how much of that the owned stock covered. Goals run in priority
 * order, so a higher-priority goal takes the stock first, as everywhere else in the plan.
 */
export function createCraftedNeedTracker(pool: CraftedInventoryPool) {
  const needs = new Map<UpgradeId, PlanUpgradeNeed>()
  let demandBefore = new Map<UpgradeId, number>()
  let stockBefore = new Map<UpgradeId, number>()

  const begin = () => {
    demandBefore = new Map(pool.demand)
    stockBefore = new Map(pool)
  }

  const end = (goalId: string, scoped: boolean) => {
    if (!scoped) return
    for (const [id, total] of pool.demand ?? []) {
      const asked = total - (demandBefore.get(id) ?? 0)
      if (asked <= 0) continue
      const taken = (stockBefore.get(id) ?? 0) - (pool.get(id) ?? 0)
      const entry = needs.get(id) ?? { need: 0, short: 0, goalIds: [] }
      entry.need += asked
      entry.short += Math.max(0, asked - taken)
      entry.goalIds.push(goalId)
      needs.set(id, entry)
    }
  }

  return { begin, end, needs: () => needs }
}

/** Every upgrade material's need, base and crafted, keyed by id: base materials from Insights' own
 *  rows (Required and Missing), crafted ones from the tracker above. */
export function buildUpgradeNeeds(
  baseMaterials: readonly PlanUpgradeMaterial[],
  craftedNeeds: ReadonlyMap<UpgradeId, PlanUpgradeNeed>
): Map<UpgradeId, PlanUpgradeNeed> {
  const needs = new Map<UpgradeId, PlanUpgradeNeed>(craftedNeeds)
  for (const material of baseMaterials) {
    needs.set(material.id, {
      need: material.required,
      short: material.missing,
      goalIds: material.goalIds,
    })
  }
  return needs
}
