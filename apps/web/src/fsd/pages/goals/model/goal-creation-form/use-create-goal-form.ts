import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"

import type { UnitId } from "@workspace/game-domain"
import {
  getInventoryUpgrades,
  getInventoryXpBooks,
} from "@workspace/player-data/queries"

import { type FarmingStrategy, type GoalKind } from "@/entities/goal"
import { usePlanningSettings } from "@/entities/planning-setting"

import {
  additionalTargetSelection,
  useUnitShopShardSupply,
} from "@/features/goal-farming"
import { useAbilityFields } from ".//use-ability-fields"
import { useAcquisitionSourceSelection } from ".//use-acquisition-source-selection"
import { useAscensionFields } from ".//use-ascension-fields"
import { useCreationPreview } from ".//use-creation-preview"
import { useEntityPrefillEffect } from ".//use-entity-prefill-effect"
import { useEntityShardSummary } from ".//use-entity-shard-summary"
import { useGoalCatalog } from "../shared/use-goal-catalog"
import { useGoalFormReset } from ".//use-goal-form-reset"
import { useGoalPrefill } from ".//use-goal-prefill"
import { useGoalPrerequisitesAndReview } from ".//use-goal-prerequisites-and-review"
import { useGoalSubmission } from ".//use-goal-submission"
import { useGoalValidationState } from ".//use-goal-validation-state"
import { useLevelRequirementPreviews } from ".//use-level-requirement-preview"
import { useLockedUnitIds } from ".//use-locked-unit-ids"
import { useProjectSelection } from "../projects/use-project-selection"
import { useRankFields } from ".//use-rank-fields"
import { useRankUpgradeSlotsSummary } from ".//use-rank-upgrade-slots-summary"
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

  const [farmingStrategy, setFarmingStrategy] =
    useState<FarmingStrategy>("TotalUpgrades")

  // Declared here rather than beside `createAnother` in useGoalSubmit: this configures the goal being
  // created, so it must be cleared by useGoalFormReset below. `createAnother` configures the form and
  // deliberately survives a reset — see design.md, "Start-paused is a checkbox in the form body".
  const [startPaused, setStartPaused] = useState(false)

  const projectSelection = useProjectSelection({ open })
  const { projects, selectedProjectIds } = projectSelection

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
  const { progressionStart, progressionEnd } = ascensionFields.state

  const abilityFields = useAbilityFields()
  const {
    abilityActiveStart,
    abilityActiveEnd,
    abilityPassiveStart,
    abilityPassiveEnd,
  } = abilityFields.state

  const levelRequirements = useLevelRequirementPreviews({
    entityType,
    enabledTypes,
    rankEnd,
    rankAdditionalTarget,
    abilityActiveEnd,
    abilityPassiveEnd,
    currentLevel: playerCharacter?.xpLevel,
    currentXp: playerCharacter?.xp,
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
    rankFields,
    upgradeFields,
    ascensionFields,
    abilityFields,
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

  const { offers: shopOffers } = useUnitShopShardSupply(entityId)
  const acquisitionSourceSelection = useAcquisitionSourceSelection({
    entityType,
    entityId,
    charactersById,
    unlockShardCostsById,
    lockedShards,
    battlesById,
    dailyEnergy: planningSettings.dailyEnergy,
    shopOffers,
  })
  const {
    shardLocationIds,
    toggleShardLocation,
    unlockRequirement,
    regularShardLocations,
    mythicShardLocations,
    campaignEnabled,
    setCampaignEnabled,
    onslaughtEnabled,
    setOnslaughtEnabled,
    shopsEnabled,
    setShopsEnabled,
    selectedShopOfferIds,
    toggleShopOffer,
    plan: acquisitionPlan,
  } = acquisitionSourceSelection

  const { toggleType, resetForm, handleEntityChange } = useGoalFormReset({
    rankFields,
    ascensionFields,
    abilityFields,
    upgradeFields,
    acquisitionSourceSelection,
    projectSelection,
    setFarmingStrategy,
    setEnabledTypes,
    setIncludeSuggestedUnlock,
    setIncludeSuggestedAscension,
    setStartPaused,
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
    abilityActiveEnd,
    abilityPassiveEnd,
    includeSuggestedUnlock,
    includeSuggestedAscension,
    progressionStart,
    progressionEnd,
    plan: acquisitionPlan,
    ascensionCostsById,
    unlockShardCostsById,
    battlesById,
    dailyEnergy: planningSettings.dailyEnergy,
  })

  const {
    currentActiveAbility,
    currentPassiveAbility,
    atMaxRank,
    atMaxProgression,
    atMaxAbility,
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
    upgradeFieldsValid: upgradeFields.isValid,
  })

  const combinedSpecParams = {
    enabledTypes,
    includesUnlock,
    includesAscension,
    ascensionSuggestion: prerequisites.needsAscension,
    ...rankFields.state,
    rankEndPointFive,
    rankEndAppliedUpgrades,
    ...ascensionFields.state,
    ...abilityFields.state,
    farmingStrategy,
    upgradeTargets,
    plan: acquisitionPlan,
  }

  const submission = useGoalSubmission({
    entityId,
    entityType,
    canSubmit,
    projects,
    selectedProjectIds,
    goalTypes: reviewItems.map((item) => item.goalType),
    dailyEnergy: planningSettings.dailyEnergy,
    inventoryUpgrades,
    open,
    specParams: combinedSpecParams,
    startPaused,
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
    // Closes the sheet without resetting the form (state is held in this hook and only cleared on
    // a "create another" success) — for the picker's "Edit Onslaught progress" link, so the user
    // can resume the in-progress goal after editing their Onslaught progress.
    onNavigateAway: () => onOpenChange(false),
    enabledTypes,
    unlockAvailable,
    atMaxRank,
    atMaxProgression,
    atMaxAbility,
    // Read-only current level for the unit card — a locked character reads as level 1.
    currentLevel: playerCharacter?.xpLevel ?? 1,
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
    reviewItems,
    rankAppliedUpgrades,
    rankUpgradeSlotsTotal,
    ...rankFields.state,
    ...ascensionFields.state,
    ...abilityFields.state,
    levelRequirements,
    farmingStrategy,
    setFarmingStrategy,
    ...upgradeFields.state,
    upgradesById,
    battlesById,
    shardLocationIds,
    toggleShardLocation,
    regularShardLocations,
    mythicShardLocations,
    campaignEnabled,
    setCampaignEnabled,
    onslaughtEnabled,
    setOnslaughtEnabled,
    shopsEnabled,
    setShopsEnabled,
    shopOffers,
    selectedShopOfferIds,
    toggleShopOffer,
    acquisitionPlan,
    projects,
    selectedProjectIds,
    selectProjects: projectSelection.selectProjects,
    startPaused,
    setStartPaused,
    ...submission,
    missingUpgrades,
    estimatePreview,
    planningSettings,
    progressionPreview,
    validationMessage,
  }
}
