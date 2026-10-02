import { rankAt, type UnitId, type UpgradeId } from "@workspace/game-domain"

import type { GoalDetail } from "@/entities/goal"
import { computeMowMissingUpgrades } from "@/features/goal-farming"

import {
  computeMissingUpgrades,
  computeUpgradeGoalNeed,
} from "../estimate/goal-spec-builder"
import type { useGoalCatalog } from "../shared/use-goal-catalog"
import {
  goalTargetEditFromDraft,
  type GoalTargetDraft,
} from "../target-edit/goal-target-edit"

type Catalog = Pick<
  ReturnType<typeof useGoalCatalog>,
  "getCharacter" | "mowsById" | "upgradesById"
>

/**
 * The base materials an edited Rank, Upgrade, or Machine-of-War Ability goal needs for its draft
 * target — gross requirement (no inventory), enough to tell which Mythic materials the Edit goal
 * dialog's Mythic-material control lists (add-mythic-material-shop-sources). Empty for other kinds.
 */
export function goalEditMaterialNeeds(
  detail: GoalDetail,
  target: GoalTargetDraft | null,
  catalog: Catalog
): { id: string; missing: number }[] {
  const toNeeds = (entries: { id: string; required: number }[]) =>
    entries.map((entry) => ({ id: entry.id, missing: entry.required }))
  const edit = target ? goalTargetEditFromDraft(target) : null
  const { config } = detail

  if (detail.goalType === "Rank" && detail.entityType === "Character") {
    const rank = edit?.rank ?? config.rank
    if (!config.rank || !rank) return []
    return toNeeds(
      computeMissingUpgrades({
        rankEnabled: true,
        character: catalog.getCharacter(detail.entityId as UnitId),
        rankStart: rankAt(config.rank.start),
        rankEnd: rankAt(rank.end),
        rankEndPointFive: rank.endPointFive,
        rankEndAppliedUpgrades: rank.endAppliedUpgrades,
        playerCharacter: undefined,
        inventoryUpgrades: undefined,
        upgradesById: catalog.upgradesById,
        includeCovered: true,
      })
    )
  }

  if (detail.goalType === "Ability" && detail.entityType === "Mow") {
    const ability = config.ability
    if (!ability) return []
    return toNeeds(
      computeMowMissingUpgrades({
        abilityEnabled: true,
        mow: catalog.mowsById?.get(detail.entityId),
        playerMow: undefined,
        activeStart: ability.activeStart,
        activeEnd: edit?.ability?.activeEnd ?? ability.activeEnd,
        passiveStart: ability.passiveStart,
        passiveEnd: edit?.ability?.passiveEnd ?? ability.passiveEnd,
        inventoryUpgrades: undefined,
        upgradesById: catalog.upgradesById,
        includeCovered: true,
      })
    )
  }

  if (detail.goalType === "Upgrade") {
    const targets = edit?.upgrade?.targets ?? config.upgrade?.targets ?? []
    return toNeeds(
      computeUpgradeGoalNeed({
        upgradeEnabled: true,
        targets: targets.map((entry) => ({
          upgradeId: entry.upgradeId as UpgradeId,
          quantity: entry.quantity,
        })),
        inventoryUpgrades: undefined,
        upgradesById: catalog.upgradesById,
        includeCovered: true,
      })
    )
  }

  return []
}
