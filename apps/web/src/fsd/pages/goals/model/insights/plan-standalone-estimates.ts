import type { UpgradeId } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import {
  calculateGoalResourceNeed,
  createCraftedInventoryPool,
  estimatePlan,
  type FlatSupplier,
  type GoalNeed,
} from "@/features/goal-farming"
import type { RankSlotAllocation } from "@/features/goal-farming"

type NeedParams = Parameters<typeof calculateGoalResourceNeed>[0]
type EstimateParams = Parameters<typeof estimatePlan>[0]

/** For a Rank goal partly covered by a higher-priority goal of its unit (`add`), costs the goal as if it
 *  were the only one (same inventory, no shared coverage) so its row can show that beside the plan-aware
 *  figures (goal-remaining-resources). Only such goals pay for the extra `estimatePlan` (`resolve`). */
export function createStandaloneEstimates(
  inventoryUpgrades: readonly { upgradeId: string; amount: number }[],
  upgradesById: NeedParams["upgradesById"]
) {
  const pending = new Map<string, { need: GoalNeed; slots: number }>()

  const add = (params: {
    detail: GoalDetail
    needParams: NeedParams
    slots: RankSlotAllocation | null
    priority: number | undefined
    flatSuppliers: readonly FlatSupplier[]
  }) => {
    const { detail, slots, priority } = params
    if (
      !slots ||
      slots.allocated <= 0 ||
      slots.allocated >= slots.standalone ||
      priority === undefined
    ) {
      return
    }
    const alone = calculateGoalResourceNeed({
      ...params.needParams,
      coveredAbilityTransitions: undefined,
      coveredRankSlots: undefined,
      craftedInventory: createCraftedInventoryPool(
        inventoryUpgrades.map((entry) => ({
          ...entry,
          upgradeId: entry.upgradeId as UpgradeId,
        })),
        upgradesById
      ),
    })
    if (!alone) return
    pending.set(detail.goalId, {
      slots: slots.standalone,
      need: {
        goalId: detail.goalId,
        priority,
        needs: alone.upgrades,
        farmingLocationIds: detail.config.farmingLocationIds ?? undefined,
        flatSuppliers:
          params.flatSuppliers.length > 0
            ? [...params.flatSuppliers]
            : undefined,
      },
    })
  }

  const resolve = (estimate: Omit<EstimateParams, "goals">) => {
    const byGoalId = new Map<string, { slots: number; energy: number }>()
    for (const [goalId, { need, slots }] of pending) {
      const outcome = estimatePlan({ ...estimate, goals: [need] }).get(goalId)
      if (outcome && outcome.status !== "Blocked") {
        byGoalId.set(goalId, { slots, energy: outcome.energyTotal })
      }
    }
    return byGoalId
  }

  return { add, resolve }
}
