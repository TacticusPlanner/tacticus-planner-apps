import type {
  CharacterAbilityCostStorageModel,
  MowUpgradeCostStorageModel,
} from "@workspace/game-catalog"

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

/** Allocates Ability materials across the plan: call `add` per goal in priority order and each Ability
 *  goal gets only the levels no higher-priority goal for the same unit already claimed (`null` when
 *  nothing is left). Kept apart from the farming need so the chips never change the plan's estimates. */
export function createAbilityMaterialsPlan(ladders: AbilityLadders = {}) {
  const coverageByEntity = new Map<string, UnitCoverage>()
  const byGoalId = new Map<string, AbilityMaterials | null>()
  const add = (
    detail: GoalDetail,
    {
      playerCharacter,
      playerMow,
    }: { playerCharacter: Player; playerMow: Player }
  ) => {
    if (detail.goalType !== "Ability") return
    const isMow = detail.entityType === "Mow"
    const unit = isMow ? playerMow : playerCharacter
    const covered =
      coverageByEntity.get(detail.entityId) ?? createUnitCoverage()
    coverageByEntity.set(detail.entityId, covered)
    byGoalId.set(
      detail.goalId,
      abilityMaterialsNeed({
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
    )
  }
  return { add, byGoalId }
}
