import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"

import type { UnitId } from "@workspace/game-domain"
import {
  getInventoryUpgrades,
  getInventoryXpBooks,
} from "@workspace/player-data/queries"

import { type FarmingStrategy, type GoalKind } from "@/entities/goal"
import { usePlanningSettings } from "@/entities/planning-setting"

import { additionalTargetSelection } from "@/features/goal-farming"
import { useAbilityFields } from ".//use-ability-fields"
import { useAscensionFields } from ".//use-ascension-fields"
import { useCreationPreview } from ".//use-creation-preview"
import { useEntityPrefillEffect } from ".//use-entity-prefill-effect"
import { useEntityShardSummary } from ".//use-entity-shard-summary"
import { useGoalCatalog } from "../shared/use-goal-catalog"
import { useGoalCreationReview } from ".//use-goal-creation-review"
import { useGoalFormReset } from ".//use-goal-form-reset"
import { useGoalPrefill } from ".//use-goal-prefill"
import { useGoalPrerequisitesAndReview } from ".//use-goal-prerequisites-and-review"
import { useGoalSubmit } from ".//use-goal-submit"
import { useGoalValidationState } from ".//use-goal-validation-state"
import { useLevelFields } from ".//use-level-fields"
import { useLevelGoalCost } from ".//use-level-goal-cost"
import { useLockedUnitIds } from ".//use-locked-unit-ids"
import { useProjectSelection } from "../projects/use-project-selection"
import { useProjectGoalConflicts } from "../projects/use-project-goal-conflicts"
import { useRankFields } from ".//use-rank-fields"
import { useRankUpgradeSlotsSummary } from ".//use-rank-upgrade-slots-summary"
import { useShardLocationSelection } from ".//use-shard-location-selection"
import { useUpgradeFields } from ".//use-upgrade-fields"
import type { CreateGoalPrefill } from ".//create-goal-launcher-context"
import { useCreateGoalPrefill } from ".//use-create-goal-prefill"

export type EntityType = "Character" | "Mow"

const defaultGoalTypes = (): Set<GoalKind> => new Set()

/** Coordinates CreateGoalSheet's catalog, field hooks, preview, and submission state. */
export function useCreateGoalForm({
  open,
  onOpenChange,
  onCreated,
  prefill,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
  prefill?: CreateGoalPrefill
}) {
  const { settings: planningSettings } = usePlanningSettings()

  const {
    charactersById,
    mowsById,
    upgradesById,
    battlesById,
    ascensionCostsById,
    unlockShardCostsById,
    characterGroups,
    mowGroups,
    unitGroups,
    getCharacter,
    getMow,
  } = useGoalCatalog()
  const inventoryUpgrades = useLiveQuery(() => getInventoryUpgrades(), [])
  const inventoryXpBooks = useLiveQuery(() => getInventoryXpBooks(), [])

  const [entityType, setEntityType] = useState<EntityType>("Character")
  const [entityId, setEntityId] = useState<UnitId | undefined>(undefined)
  const [enabledTypes, setEnabledTypes] =
    useState<ReadonlySet<GoalKind>>(defaultGoalTypes)
  const [includeSuggestedUnlock, setIncludeSuggestedUnlock] = useState(true)
  const [includeSuggestedAscension, setIncludeSuggestedAscension] =
    useState(true)
  const [includeSuggestedLevel, setIncludeSuggestedLevel] = useState(true)

  const [farmingStrategy, setFarmingStrategy] =
    useState<FarmingStrategy>("TotalUpgrades")

  const projectSelection = useProjectSelection({ open })
  const { projects, selectedProjectIds, toggleProject } = projectSelection

  const {
    playerEntity,
    playerCharacter,
    playerMow,
    loading: entityLoading,
  } = useGoalPrefill(entityId, entityType)

  const character =
    entityType === "Character" && entityId ? getCharacter(entityId) : undefined
  const mow = entityType === "Mow" && entityId ? getMow(entityId) : undefined

  const rankFields = useRankFields()
  const { rankStart, rankEnd, rankAdditionalTarget } = rankFields.state
  const {
    pointFive: rankEndPointFive,
    appliedUpgrades: rankEndAppliedUpgrades,
    topRowCount: rankEndTopRowCount,
  } = additionalTargetSelection(rankAdditionalTarget)

  const { rankUpgradeSlotsTotal, rankAppliedUpgrades } =
    useRankUpgradeSlotsSummary(character, rankStart, playerCharacter)

  const ascensionFields = useAscensionFields()
  const { progressionStart, progressionEnd, ascensionFarmingSource } =
    ascensionFields.state

  const abilityFields = useAbilityFields()
  const {
    abilityActiveStart,
    abilityActiveEnd,
    abilityPassiveStart,
    abilityPassiveEnd,
  } = abilityFields.state

  const levelFields = useLevelFields()
  const { levelStart, levelEnd } = levelFields.state

  const levelCost = useLevelGoalCost({
    enabled: enabledTypes.has("Level"),
    levelStart,
    levelEnd,
    currentXp: playerCharacter?.xp ?? 0,
    inventoryXpBooks,
  })

  const upgradeFields = useUpgradeFields({
    character,
    mow,
    upgradesById,
    currentRank: playerCharacter?.rank,
    upgradeEnabled: enabledTypes.has("Upgrade"),
    inventoryUpgrades,
  })
  const { upgradeTargets } = upgradeFields.state

  const { resetPrefillGuard } = useEntityPrefillEffect({
    entityId,
    playerEntity,
    rank: playerCharacter?.rank,
    xpLevel: playerCharacter?.xpLevel,
    rankFields,
    upgradeFields,
    ascensionFields,
    abilityFields,
    levelFields,
    setEnabledTypes,
  })

  const isOwned = !!playerEntity

  const { usesMythicShards, lockedShards, unlockAvailable } =
    useEntityShardSummary(
      entityType,
      entityId,
      isOwned,
      playerEntity,
      charactersById
    )

  const shardLocationSelection = useShardLocationSelection({
    entityType,
    entityId,
    charactersById,
    unlockShardCostsById,
    lockedShards,
    battlesById,
    dailyEnergy: planningSettings.dailyEnergy,
  })
  const {
    shardLocationIds,
    toggleShardLocation,
    unlockRequirement,
    regularShardLocations,
    mythicShardLocations,
    selectedRegularShardLocationIds,
    selectedMythicShardLocationIds,
  } = shardLocationSelection

  const { toggleType, resetForm, handleEntityChange } = useGoalFormReset({
    rankFields,
    ascensionFields,
    abilityFields,
    levelFields,
    upgradeFields,
    shardLocationSelection,
    projectSelection,
    setFarmingStrategy,
    setEnabledTypes,
    setIncludeSuggestedUnlock,
    setIncludeSuggestedAscension,
    setIncludeSuggestedLevel,
    resetPrefillGuard,
    setEntityType,
    setEntityId,
    charactersById,
  })

  useCreateGoalPrefill({
    open,
    prefill,
    entityId,
    playerEntity,
    handleEntityChange,
    setEntityType,
    setEnabledTypes,
    selectProjects: projectSelection.selectProjects,
    setLevelEnd: levelFields.state.setLevelEnd,
    setProgressionEnd: ascensionFields.state.setProgressionEnd,
  })

  const lockedUnitIds = useLockedUnitIds(characterGroups, mowGroups)

  const { missingUpgrades, snapshotUpgrades, estimatePreview } =
    useCreationPreview({
      entityType,
      enabledTypes,
      character,
      mow,
      playerCharacter,
      playerMow,
      rankStart,
      rankEnd,
      rankEndPointFive,
      rankEndAppliedUpgrades,
      rankEndTopRowCount,
      abilityActiveStart,
      abilityActiveEnd,
      abilityPassiveStart,
      abilityPassiveEnd,
      inventoryUpgrades,
      upgradesById,
      battlesById,
      dailyEnergy: planningSettings.dailyEnergy,
    })

  const {
    prerequisites,
    includesUnlock,
    includesAscension,
    includesLevel,
    progressionPreview,
    reviewItems,
  } = useGoalPrerequisitesAndReview({
    entityId,
    entityType,
    isOwned,
    playerEntity,
    character:
      entityType === "Character" && entityId
        ? charactersById?.get(entityId)
        : undefined,
    enabledTypes,
    rankEnd,
    rankAdditionalTarget,
    abilityActiveEnd,
    abilityPassiveEnd,
    includeSuggestedUnlock,
    includeSuggestedAscension,
    includeSuggestedLevel,
    progressionStart,
    progressionEnd,
    ascensionFarmingSource,
    ascensionCostsById,
    unlockShardCostsById,
    battlesById,
    dailyEnergy: planningSettings.dailyEnergy,
    selectedRegularShardLocationIds,
    selectedMythicShardLocationIds,
  })

  const {
    currentActiveAbility,
    currentPassiveAbility,
    atMaxRank,
    atMaxProgression,
    atMaxAbility,
    atMaxLevel,
    validationMessage,
    canSubmit,
  } = useGoalValidationState({
    entityType,
    entityId,
    isOwned,
    enabledTypes,
    playerEntity,
    playerCharacter,
    playerMow,
    rankStart,
    rankEnd,
    progressionStart,
    progressionEnd,
    abilityActiveStart,
    abilityActiveEnd,
    abilityPassiveStart,
    abilityPassiveEnd,
    levelStart,
    levelEnd,
    upgradeFieldsValid: upgradeFields.isValid,
  })

  const combinedSpecParams = {
    enabledTypes,
    includesUnlock,
    includesAscension,
    includesLevel,
    ascensionSuggestion: prerequisites.needsAscension,
    levelSuggestion: prerequisites.needsLevel,
    ...rankFields.state,
    rankEndPointFive,
    rankEndAppliedUpgrades,
    ...ascensionFields.state,
    ...abilityFields.state,
    ...levelFields.state,
    farmingStrategy,
    upgradeTargets,
    selectedRegularShardLocationIds,
    selectedMythicShardLocationIds,
  }

  const projectConflictState = useProjectGoalConflicts({
    projects,
    selectedProjectIds,
    entityType,
    entityId,
    goalTypes: reviewItems.map((item) => item.goalType),
  })
  const submissionAllowed =
    canSubmit &&
    !projectConflictState.loading &&
    projectConflictState.conflicts.length === 0

  const { selectedProjects, perProjectEstimates, estimatedProjectIds } =
    useGoalCreationReview({
      entityId,
      entityType,
      canSubmit,
      selectedProjectIds,
      projects,
      dailyEnergy: planningSettings.dailyEnergy,
      inventoryUpgrades,
      open,
      specParams: combinedSpecParams,
    })

  const submission = useGoalSubmit({
    entityId,
    entityType,
    canSubmit: submissionAllowed,
    selectedProjects,
    specParams: combinedSpecParams,
    snapshotContext: {
      entityType,
      playerEntity,
      playerCharacter,
      currentActiveAbility,
      currentPassiveAbility,
      missingUpgrades: snapshotUpgrades,
    },
    onOpenChange,
    onCreated,
    resetForm,
  })

  return {
    charactersById,
    mowsById,
    unitGroups,
    entityType,
    entityId,
    handleEntityChange,
    enabledTypes,
    unlockAvailable,
    atMaxRank,
    atMaxProgression,
    atMaxAbility,
    atMaxLevel,
    entityAlreadyOwned: isOwned,
    entityLoading,
    ownedShards: playerEntity?.shards,
    ownedMythicShards: playerEntity?.mythicShards,
    usesMythicShards,
    lockedShards,
    lockedUnitIds,
    unlockRequirement,
    toggleType,
    prerequisites,
    includeSuggestedUnlock,
    setIncludeSuggestedUnlock,
    includeSuggestedAscension,
    setIncludeSuggestedAscension,
    includeSuggestedLevel,
    setIncludeSuggestedLevel,
    reviewItems,
    rankAppliedUpgrades,
    rankUpgradeSlotsTotal,
    ...rankFields.state,
    ...ascensionFields.state,
    ...abilityFields.state,
    ...levelFields.state,
    levelCost,
    farmingStrategy,
    setFarmingStrategy,
    ...upgradeFields.state,
    upgradesById,
    battlesById,
    shardLocationIds,
    toggleShardLocation,
    regularShardLocations,
    mythicShardLocations,
    projects,
    selectedProjectIds,
    toggleProject,
    projectConflicts: projectConflictState.conflicts,
    perProjectEstimates,
    estimatedProjectIds,
    ...submission,
    missingUpgrades,
    estimatePreview,
    planningSettings,
    progressionPreview,
    validationMessage,
    canSubmit: submissionAllowed,
  }
}
