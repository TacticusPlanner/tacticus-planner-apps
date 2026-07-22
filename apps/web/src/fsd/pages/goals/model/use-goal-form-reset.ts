import type { UnitId } from "@workspace/game-domain"
import type { CharacterStorageModel } from "@workspace/game-catalog"

import type { FarmingStrategy, GoalKind } from "@/entities/goal"

import type { useAbilityFields } from "./use-ability-fields"
import type { useAscensionFields } from "./use-ascension-fields"
import type { useLevelFields } from "./use-level-fields"
import type { useProjectSelection } from "./use-project-selection"
import type { useRankFields } from "./use-rank-fields"
import type { useShardLocationSelection } from "./use-shard-location-selection"
import type { useUpgradeFields } from "./use-upgrade-fields"

type EntityType = "Character" | "Mow"

/**
 * The goal-type toggle handler + every "clear back to defaults" entry point (per-target-field
 * reset, the wider per-unit selections reset, the whole-form reset, and switching to a newly picked
 * unit) — split out of use-create-goal-form.ts purely for that file's own max-lines budget. Takes
 * every sub-hook whose own `reset()` these compose, rather than owning any field state itself.
 */
export function useGoalFormReset(params: {
  rankFields: ReturnType<typeof useRankFields>
  ascensionFields: ReturnType<typeof useAscensionFields>
  abilityFields: ReturnType<typeof useAbilityFields>
  levelFields: ReturnType<typeof useLevelFields>
  upgradeFields: ReturnType<typeof useUpgradeFields>
  shardLocationSelection: ReturnType<typeof useShardLocationSelection>
  projectSelection: ReturnType<typeof useProjectSelection>
  setFarmingStrategy: (value: FarmingStrategy) => void
  setEnabledTypes: (
    update:
      | ReadonlySet<GoalKind>
      | ((current: ReadonlySet<GoalKind>) => ReadonlySet<GoalKind>)
  ) => void
  setIncludeSuggestedUnlock: (value: boolean) => void
  setIncludeSuggestedAscension: (value: boolean) => void
  setIncludeSuggestedLevel: (value: boolean) => void
  resetPrefillGuard: () => void
  setEntityType: (value: EntityType) => void
  setEntityId: (value: UnitId | undefined) => void
  charactersById: ReadonlyMap<string, CharacterStorageModel> | undefined
}) {
  const toggleType = (kind: GoalKind, enabled: boolean) => {
    params.setEnabledTypes((current) => {
      const next = new Set(current)
      if (enabled) {
        next.add(kind)
      } else {
        next.delete(kind)
      }
      return next
    })
  }

  const resetTargetFields = () => {
    params.rankFields.reset()
    params.ascensionFields.reset()
    params.abilityFields.reset()
    params.levelFields.reset()
    params.upgradeFields.reset()
    params.setFarmingStrategy("TotalUpgrades")
    params.shardLocationSelection.reset()
  }

  // Shared by resetForm (also clears entity selection + projects) and handleEntityChange (also
  // switches entity) — every goal-type toggle/suggestion/target field reverts to its just-picked-
  // a-unit default.
  const resetSelections = () => {
    params.setEnabledTypes(new Set())
    params.setIncludeSuggestedUnlock(true)
    params.setIncludeSuggestedAscension(true)
    params.setIncludeSuggestedLevel(true)
    resetTargetFields()
    params.resetPrefillGuard()
  }

  const resetForm = () => {
    params.setEntityType("Character")
    params.setEntityId(undefined)
    resetSelections()
    params.projectSelection.reset()
  }

  // The Unit picker (plan: merged Character/Mow tabs into one) offers both kinds together — the
  // selected id's actual kind is inferred from the catalog rather than picked via a separate tab,
  // and drives which goal kinds are offered (see CHARACTER_GOAL_KINDS/MOW_GOAL_KINDS in
  // create-goal-sheet.tsx, e.g. Rank is never offered for a Mow).
  const handleEntityChange = (id: UnitId) => {
    const type: EntityType = params.charactersById?.has(id)
      ? "Character"
      : "Mow"
    params.setEntityType(type)
    params.setEntityId(id)
    resetSelections()
  }

  return { toggleType, resetForm, handleEntityChange }
}
