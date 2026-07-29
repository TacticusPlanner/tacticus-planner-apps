import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"

import type { UnitId } from "@workspace/game-domain"
import {
  getInventoryUpgrades,
  getInventoryXpBooks,
} from "@workspace/player-data/queries"

import { type FarmingStrategy, type GoalKind } from "@/entities/goal"
import { usePlanningSettings } from "@/entities/planning-setting"

import { additionalTargetSelection } from "../estimate/rank-additional-target"
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
import { useGoalTypeConflicts } from ".//use-goal-type-conflicts"
import { useGoalValidationState } from ".//use-goal-validation-state"
import { useLevelFields } from ".//use-level-fields"
import { useLevelGoalCost } from ".//use-level-goal-cost"
import { useLockedUnitIds } from ".//use-locked-unit-ids"
import { useProjectSelection } from "../projects/use-project-selection"
import { useRankFields } from ".//use-rank-fields"
import { useRankUpgradeSlotsSummary } from ".//use-rank-upgrade-slots-summary"
import { useShardLocationSelection } from ".//use-shard-location-selection"
import { useUpgradeFields } from ".//use-upgrade-fields"

export type EntityType = "Character" | "Mow"

const defaultGoalTypes = (): Set<GoalKind> => new Set()

/**
 * Everything CreateGoalSheet needs to render: catalog data, per-field form state, the synced-data
 * prefill effect, the resource-requirement preview, and the submit handler. Split out of the UI
 * component so create-goal-sheet.tsx stays presentational (and under this repo's max-lines rule) —
 * each goal-type's own target-range state further lives in its own sub-hook (use-rank-fields.ts,
 * use-ascension-fields.ts, use-ability-fields.ts, use-upgrade-fields.ts), this hook owning only the
 * entity selection, the cross-cutting fields (farming strategy, projects), the single prefill
 * effect that coordinates all four sub-hooks, and the submit handler that assembles their state
 * into a request. Every sub-hook's public state is named identically to this hook's own former
 * flat fields, so it can be spread straight into the return value below without changing the
 * shape consumers (CreateGoalSheet, its field components, and their tests) already depend on.
 */
export function useCreateGoalForm({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
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
  const {
    projects,
    selectedProjectIds,
    toggleProject,
    projectPriorities,
    setProjectPriority,
  } = projectSelection

  const {
    playerEntity,
    playerCharacter,
    playerMow,
    loading: entityLoading,
  } = useGoalPrefill(entityId, entityType)

  const character =
    entityType === "Character" && entityId ? getCharacter(entityId) : undefined
  const mow = entityType === "Mow" && entityId ? getMow(entityId) : undefined

  // Only each sub-hook's fields actually referenced by this hook's own computations below are
  // destructured by name — the rest flow straight through via `...xFields.state` below, unread here.
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

  // Whether the selected entity is already in the caller's synced roster — an Unlock goal never
  // makes sense for it (see `unlockAvailable` and the validation check below), regardless of
  // Character/MoW.
  const isOwned = !!playerEntity

  // Shard progress + unlock-availability for the selected entity — see use-entity-shard-summary.ts.
  const { usesMythicShards, lockedShards, unlockAvailable } =
    useEntityShardSummary(
      entityType,
      entityId,
      isOwned,
      playerEntity,
      charactersById
    )

  // Shard-location selector state (Unlock/Ascension) — see use-shard-location-selection.ts.
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

  const lockedUnitIds = useLockedUnitIds(characterGroups, mowGroups)

  const { hasActiveOrPausedGoal } = useGoalTypeConflicts({
    entityId,
    entityType,
    enabled: open && !!entityId,
  })

  // Resource-requirement preview + isolated day-by-day estimate (plan §9 context (a)) — pure calc
  // lives in ./goal-preview.ts, memoized wrapper in ./use-creation-preview.ts.
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
    rankStart,
    rankEnd,
    rankEndPointFive,
    rankEndAppliedUpgrades,
    progressionStart,
    progressionEnd,
    ascensionFarmingSource,
    abilityActiveStart,
    abilityActiveEnd,
    abilityPassiveStart,
    abilityPassiveEnd,
    levelStart,
    levelEnd,
    farmingStrategy,
    upgradeTargets,
    selectedRegularShardLocationIds,
    selectedMythicShardLocationIds,
  }

  const { selectedProjects, perProjectEstimates, estimatedProjectIds } =
    useGoalCreationReview({
      entityId,
      entityType,
      canSubmit,
      selectedProjectIds,
      projects,
      projectPriorities,
      dailyEnergy: planningSettings.dailyEnergy,
      inventoryUpgrades,
      open,
      specParams: combinedSpecParams,
    })

  const {
    createAnother,
    setCreateAnother,
    status,
    errorMessage,
    handleSubmit,
  } = useGoalSubmit({
    entityId,
    entityType,
    canSubmit,
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
    hasActiveOrPausedGoal,
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
    projectPriorities,
    setProjectPriority,
    perProjectEstimates,
    estimatedProjectIds,
    createAnother,
    setCreateAnother,
    status,
    errorMessage,
    missingUpgrades,
    estimatePreview,
    planningSettings,
    progressionPreview,
    validationMessage,
    canSubmit,
    handleSubmit,
  }
}
