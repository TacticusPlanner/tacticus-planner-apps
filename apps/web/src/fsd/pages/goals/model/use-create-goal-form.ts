import { useMemo, useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { useQuery } from "@tanstack/react-query"

import type { UnitId } from "@workspace/game-domain"
import {
  getInventoryUpgrades,
  getInventoryXpBooks,
} from "@workspace/player-data/queries"

import { type FarmingStrategy, type GoalKind } from "@/entities/goal"
import { usePlanningSettings } from "@/entities/planning-setting"
import { projectQueries } from "@/entities/project"

import { computeCreationPreview } from "./goal-preview"
import { additionalTargetSelection } from "./rank-additional-target"
import { useAbilityFields } from "./use-ability-fields"
import { useAscensionFields } from "./use-ascension-fields"
import { useEntityPrefillEffect } from "./use-entity-prefill-effect"
import { useEntityShardSummary } from "./use-entity-shard-summary"
import { useGoalCatalog } from "./use-goal-catalog"
import { useGoalPrefill } from "./use-goal-prefill"
import { useGoalPrerequisitesAndReview } from "./use-goal-prerequisites-and-review"
import { useGoalSubmit } from "./use-goal-submit"
import { useGoalValidationState } from "./use-goal-validation-state"
import { useLevelFields } from "./use-level-fields"
import { useLevelGoalCost } from "./use-level-goal-cost"
import { useLockedUnitIds } from "./use-locked-unit-ids"
import { useRankFields } from "./use-rank-fields"
import { useUpgradeFields } from "./use-upgrade-fields"

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

  // Empty selection means "use the caller's default project" (goal.api.ts omits projectIds in that
  // case) — a goal may belong to several projects at once (checkbox list, plan: multi-project goals).
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])

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
  // destructured by name — the rest (setters, option lists, and everything Upgrade-specific beyond
  // `upgradeTargets`) flow straight through via `...xFields.state` in the return value at the
  // bottom, unread here.
  const rankFields = useRankFields()
  const { rankStart, rankEnd, rankAdditionalTarget } = rankFields.state
  const {
    pointFive: rankEndPointFive,
    appliedUpgrades: rankEndAppliedUpgrades,
    topRowCount: rankEndTopRowCount,
  } = additionalTargetSelection(rankAdditionalTarget)

  // How many of the current rank's own upgrade slots are already applied — the small "3/6" badge
  // next to the read-only "Current rank" field. `rankUpgradeSlotsTotal` comes from the catalog (so
  // it's known even for a locked/unowned character); `rankAppliedUpgrades` is 0 until synced player
  // data resolves, deduplicated and capped the same way the backend's achievement check treats
  // `appliedUpgradeSlots` (`GoalAchievementEvaluator.RankAchieved`'s `.Distinct().Count()`).
  const rankUpgradeSlotsTotal =
    character?.rankUpUpgrades.find((entry) => entry.rank === rankStart)
      ?.upgradeIds.length ?? 0
  const rankAppliedUpgrades = Math.min(
    playerCharacter ? new Set(playerCharacter.appliedUpgradeSlots).size : 0,
    rankUpgradeSlotsTotal
  )

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

  const projectsQuery = useQuery({
    ...projectQueries.list(),
    enabled: open,
  })
  const projects = projectsQuery.data?.projects ?? []

  const toggleProject = (projectId: string, enabled: boolean) => {
    setSelectedProjectIds((current) =>
      enabled
        ? [...current, projectId]
        : current.filter((id) => id !== projectId)
    )
  }

  const toggleType = (kind: GoalKind, enabled: boolean) => {
    setEnabledTypes((current) => {
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
    rankFields.reset()
    ascensionFields.reset()
    abilityFields.reset()
    levelFields.reset()
    upgradeFields.reset()
    setFarmingStrategy("TotalUpgrades")
  }

  // Shared by resetForm (also clears entity selection + projects) and handleEntityChange (also
  // switches entity) — every goal-type toggle/suggestion/target field reverts to its just-picked-
  // a-unit default.
  const resetSelections = () => {
    setEnabledTypes(defaultGoalTypes())
    setIncludeSuggestedUnlock(true)
    setIncludeSuggestedAscension(true)
    setIncludeSuggestedLevel(true)
    resetTargetFields()
    resetPrefillGuard()
  }

  const resetForm = () => {
    setEntityType("Character")
    setEntityId(undefined)
    resetSelections()
    setSelectedProjectIds([])
  }

  // The Unit picker (plan: merged Character/Mow tabs into one) offers both kinds together — the
  // selected id's actual kind is inferred from the catalog rather than picked via a separate tab,
  // and drives which goal kinds are offered (see CHARACTER_GOAL_KINDS/MOW_GOAL_KINDS in
  // create-goal-sheet.tsx, e.g. Rank is never offered for a Mow).
  const handleEntityChange = (id: UnitId) => {
    const type: EntityType = charactersById?.has(id) ? "Character" : "Mow"
    setEntityType(type)
    setEntityId(id)
    resetSelections()
  }

  // Whether the selected entity is already in the caller's synced roster — an Unlock goal never
  // makes sense for it (see `unlockAvailable` and the validation check below), regardless of
  // Character/MoW.
  const isOwned = !!playerEntity

  // Shard progress for the selected-entity info card (below the unit picker) — see
  // use-entity-shard-summary.ts for the owned/locked split.
  const { usesMythicShards, lockedShards } = useEntityShardSummary(
    entityId,
    playerEntity
  )
  // A MoW has no `shardLocations` in the catalog at all (unlike a Character, whose farmability can
  // be genuinely absent — an unreleased character has no catalog shard locations yet), so Unlock is
  // simply offered whenever a MoW isn't already owned; its resource cost just isn't estimated yet
  // (see `unlockResourceNeed`'s `isMow` short-circuit).
  const unlockAvailable =
    !!entityId &&
    !isOwned &&
    (entityType === "Mow" ||
      (charactersById?.get(entityId)?.shardLocations?.length ?? 0) > 0)

  const lockedUnitIds = useLockedUnitIds(characterGroups, mowGroups)

  // Resource-requirement preview + isolated day-by-day estimate (plan §9 context (a)) — pure calc
  // lives in ./goal-preview.ts, kept out of this file for its max-lines budget.
  const { missingUpgrades, snapshotUpgrades, estimatePreview } = useMemo(
    () =>
      computeCreationPreview({
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
      }),
    [
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
      planningSettings.dailyEnergy,
    ]
  )

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
    selectedProjectIds,
    specParams: {
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
    },
    snapshotContext: {
      entityType,
      playerEntity,
      playerCharacter,
      currentActiveAbility,
      currentPassiveAbility,
      missingUpgrades: snapshotUpgrades,
      estimatePreview,
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
    projects,
    selectedProjectIds,
    toggleProject,
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
