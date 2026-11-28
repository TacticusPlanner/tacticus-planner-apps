import { useState, useMemo } from "react"
import {
  startingProgression,
  firstRank,
  rankIndex,
} from "@workspace/game-domain"
import type {
  UnitId,
  Rank,
  UpgradeId,
  FactionGroup,
} from "@workspace/game-domain"
import type { FarmingStrategy, GoalKind } from "@/entities/goal"
import { usePlanningSettings } from "@/entities/planning-setting"
import { usePlayerChunk } from "@/shared/local-data"
import {
  additionalTargetSelection,
  useUnitShopShardSupply,
  additionalTargetOptions,
} from "@/entities/goal-farming"
import type { RankAdditionalTarget } from "@/entities/goal-farming"
import { useAcquisitionSourceSelection } from "./use-acquisition-source-selection"
import { useMythicMaterialSelection } from "./use-mythic-material-selection"
import { useEntityShardSummary } from "./use-entity-shard-summary"
import { useGoalCatalog } from "../shared/use-goal-catalog"
import { chunkOrUndefined, toXpBooks } from "../shared/read-data"
import { goalKindsForEntity } from "../shared/goal-validation"
import { useGoalFormReset } from "./use-goal-form-reset"
import { useGoalPrefill } from "./use-goal-prefill"
import { useEntityPrefill } from "./use-entity-prefill"
import { useGoalPrerequisitesAndReview } from "./use-goal-prerequisites-and-review"
import { useGoalSubmission } from "./use-goal-submission"
import { useGoalValidationState } from "./use-goal-validation-state"
import { useGoalMilestones } from "./use-goal-milestones"
import { useLevelRequirementPreviews } from "./use-level-requirement-preview"
import { useUpgradeFields } from "./use-upgrade-fields"
import type { CreateGoalPrefill } from "./create-goal-launcher-context"
import { useCreateGoalPrefill } from "./use-create-goal-prefill"
import { useDefaultUnitPreselect } from "./use-default-unit-preselect"
import { computeCreationPreview } from "./goal-preview"
import { firstFreeTarget, useTakenTargets } from "./first-free-target"
import { rankOptionsAbove } from "../target-edit/goal-target-edit"
import { useAscensionFields } from "./use-ascension-fields"
import { useQuery } from "@tanstack/react-query"
import { useGlobalGoalPlan } from "@/entities/goal"
import { readyData } from "@/shared/lib"
import { projectQueries } from "@/entities/project"

export type EntityType = "Character" | "Mow"

const defaultGoalTypes = (): Set<GoalKind> => new Set()

/** Coordinates CreateGoalSheet's catalog, field hooks, preview, and submission state. */
export function useCreateGoalForm({
  open,
  onOpenChange,
  prefill,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
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
  const inventoryUpgrades = readyData(
    usePlayerChunk("inventory-upgrades", chunkOrUndefined)
  )
  const inventoryXpBooks = readyData(usePlayerChunk("inventory", toXpBooks))

  const [entityType, setEntityType] = useState<EntityType>("Character")
  const [entityId, setEntityId] = useState<UnitId | undefined>(undefined)
  const [enabledTypes, setEnabledTypes] =
    useState<ReadonlySet<GoalKind>>(defaultGoalTypes)
  const [includeSuggestedUnlock, setIncludeSuggestedUnlock] = useState(true)
  const [includeSuggestedAscension, setIncludeSuggestedAscension] =
    useState(true)
  // The one goal card shown expanded (goal-creation: cards collapse to a one-line summary).
  const [expandedKind, setExpandedKind] = useState<GoalKind | null>(null)
  // Each goal type card's optional note, and where the new goals go in the global order (null: last).
  const [notes, setNotes] = useState<Partial<Record<GoalKind, string>>>({})
  const [priorityPosition, setPriorityPosition] = useState<number | null>(null)
  const globalPlan = useGlobalGoalPlan()
  const inFlightCount = globalPlan.inFlight.length
  // The unit's in-flight targets: defaults skip them and the pickers mark them as already a goal.
  const takenTargets = useTakenTargets(entityType, entityId)

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

  const rankFields = useRankFields(takenTargets.takenFor("Rank"))
  const { rankStart, rankEnd, rankAdditionalTarget } = rankFields.state
  const {
    pointFive: rankEndPointFive,
    appliedUpgrades: rankEndAppliedUpgrades,
  } = additionalTargetSelection(rankAdditionalTarget)

  const { rankUpgradeSlotsTotal, rankAppliedUpgrades } =
    useRankUpgradeSlotsSummary(character, rankStart, playerCharacter)

  const characterView =
    entityType === "Character" && entityId
      ? charactersById?.get(entityId)
      : undefined
  const unownedCharacterStart =
    characterView && !playerEntity
      ? startingProgression(characterView.initialRarity)
      : undefined
  const ascensionFields = useAscensionFields(
    takenTargets.takenFor("Ascension"),
    // A locked character has no synced progression; unlocking it lands on its starting rarity, so an
    // Ascension goal starts there rather than at Common (which would charge orbs it never needs).
    unownedCharacterStart
  )
  const { progressionStart, progressionEnd } = ascensionFields.state

  const abilityFields = useAbilityFields(takenTargets.takenFor("Ability"))
  const milestoneFields = useGoalMilestones()
  const { milestones } = milestoneFields
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
    rarity: planningSettings.xpBookRarity,
  })

  const upgradeFields = useUpgradeFields({
    character,
    mow,
    upgradesById,
    currentRank: playerCharacter?.rank,
    upgradeEnabled: enabledTypes.has("Upgrade"),
    inventoryUpgrades,
  })
  const { upgradeTargets, upgradeSpec } = upgradeFields.state

  const { resetPrefillGuard } = useEntityPrefill({
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

  const { offers: shopOffers } = useUnitShopShardSupply(entityId)

  const {
    usesMythicShards,
    lockedShards,
    unlockAvailable: unlockAcquirable,
  } = useEntityShardSummary(
    entityType,
    entityId,
    isOwned,
    playerEntity,
    charactersById,
    shopOffers
  )

  // An in-flight Unlock goal already covers unlocking this unit (goal-creation).
  const existingUnlockGoalId = takenTargets.unlockGoal?.goalId
  const unlockAvailable = unlockAcquirable && !existingUnlockGoalId

  const acquisitionSourceSelection = useAcquisitionSourceSelection({
    entityType,
    entityId,
    charactersById,
    unlockShardCostsById,
    lockedShards,
    battlesById,
    dailyEnergy: planningSettings.dailyEnergy,
    shopOffers,
    defaultOnslaughtEnabled: true, // Unlock filters Onslaught out itself.
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

  const {
    toggleType: toggleEnabledType,
    resetForm: resetFormFields,
    handleEntityChange: changeEntity,
  } = useGoalFormReset({
    rankFields,
    ascensionFields,
    abilityFields,
    upgradeFields,
    milestoneFields,
    acquisitionSourceSelection,
    projectSelection,
    setFarmingStrategy,
    enabledTypes,
    setEnabledTypes,
    setIncludeSuggestedUnlock,
    setIncludeSuggestedAscension,
    setStartPaused,
    resetPrefillGuard,
    setEntityType,
    setEntityId,
    charactersById,
  })
  // Enabling a type expands its card and collapses the rest; notes and priority go with the form.
  const toggleType = (kind: GoalKind, enabled: boolean) => {
    toggleEnabledType(kind, enabled)
    if (enabled) setExpandedKind(kind)
  }
  const clearComposerExtras = () => {
    setExpandedKind(null)
    setNotes({})
    setPriorityPosition(null)
  }
  const resetForm = () => {
    resetFormFields()
    clearComposerExtras()
  }
  const handleEntityChange = (id: UnitId) => {
    changeEntity(id)
    clearComposerExtras()
  }

  useCreateGoalPrefill({
    open,
    prefill,
    entityId,
    playerEntity,
    handleEntityChange,
    setEntityType,
    setEnabledTypes,
    selectProjects: projectSelection.selectProjects,
    targetSetters: { ...ascensionFields.state, ...rankFields.state },
    upgradeFields,
  })

  useDefaultUnitPreselect({
    open,
    prefill,
    entityId,
    unitGroups,
    isCharacter: (id) => !!charactersById?.has(id),
    handleEntityChange,
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
      abilityActiveStart,
      abilityActiveEnd,
      abilityPassiveStart,
      abilityPassiveEnd,
      inventoryUpgrades,
      upgradesById,
      battlesById,
      dailyEnergy: planningSettings.dailyEnergy,
    })

  const mythicMaterialSelection = useMythicMaterialSelection({
    needs: [...missingUpgrades, ...upgradeFields.state.upgradeGoalNeed],
    upgradesById,
    resetKey: entityId,
  })

  const {
    prerequisites,
    includesUnlock,
    includesAscension,
    progressionPreview,
    reviewItems,
    existingAscensions,
  } = useGoalPrerequisitesAndReview({
    entityId,
    entityType,
    // An existing Unlock goal already unlocks the unit, so no new one is suggested.
    isOwned: isOwned || !!existingUnlockGoalId,
    playerEntity,
    character: characterView,
    enabledTypes,
    rankEnd,
    abilityActiveEnd,
    abilityPassiveEnd,
    milestones,
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
    issues: formIssues,
    milestoneIssue,
    canSubmit,
  } = useGoalValidationState({
    entityType,
    entityId,
    isOwned,
    enabledTypes,
    playerEntity,
    playerCharacter,
    playerMow,
    ...rankFields.state,
    progressionStart,
    progressionEnd,
    abilityActiveStart,
    abilityActiveEnd,
    abilityPassiveStart,
    abilityPassiveEnd,
    abilityTargets: abilityFields.state,
    upgradeFieldsValid: upgradeFields.isValid,
    invalidUpgradeQuantityIds: upgradeFields.state.invalidUpgradeQuantityIds,
    milestones,
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
    ...upgradeSpec,
    plan: acquisitionPlan,
    mythicMaterialSources: mythicMaterialSelection.acquisitionSources,
    isMow: entityType === "Mow",
    milestones,
    baseProgression: prerequisites.baseProgression,
    existingAscensions,
  }

  const submission = useGoalSubmission({
    entityId,
    entityType,
    canSubmit,
    projects,
    selectedProjectIds,
    dailyEnergy: planningSettings.dailyEnergy,
    inventoryUpgrades,
    open,
    specParams: combinedSpecParams,
    startPaused,
    notes,
    position: priorityPosition,
    snapshotContext: {
      entityType,
      playerEntity,
      playerCharacter,
      currentActiveAbility,
      currentPassiveAbility,
      missingUpgrades: snapshotUpgrades.filter((entry) =>
        upgradesById.has(entry.id)
      ),
    },
    onOpenChange,
    resetForm,
  })

  const { slotConflictIssue, goalLimitIssue, ...submissionState } = submission
  // Every blocking problem, in card order (goal-creation: shown inline and counted beside submit).
  const goalKinds = goalKindsForEntity(entityType)
  const issues = [...formIssues, slotConflictIssue, goalLimitIssue]
    .filter((issue) => issue !== null)
    .toSorted((a, b) => goalKinds.indexOf(a.kind) - goalKinds.indexOf(b.kind))

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
    xpBookRarity: planningSettings.xpBookRarity,
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
    mythicMaterialSelection,
    projects,
    selectedProjectIds,
    selectProjects: projectSelection.selectProjects,
    startPaused,
    setStartPaused,
    ...submissionState,
    issues,
    expandedKind,
    setExpandedKind,
    notes,
    setNote: (kind: GoalKind, note: string) =>
      setNotes((current) => ({ ...current, [kind]: note })),
    // 1-based position in the global order; the new goals go last unless the user moves them.
    priorityPosition: priorityPosition ?? inFlightCount + 1,
    priorityTotal: inFlightCount + 1,
    priorityOccupants: globalPlan.inFlight,
    setPriorityPosition: (position: number) =>
      setPriorityPosition(position > inFlightCount ? null : position),
    takenTargetsFor: takenTargets.takenFor,
    existingUnlockGoalId,
    combinedSpecParams,
    inventoryLoaded: inventoryUpgrades !== undefined,
    missingUpgrades,
    estimatePreview,
    planningSettings,
    progressionPreview,
    milestoneFields,
    milestoneIssue,
  }
}

/**
 * The Ability goal's per-track target state — read-only active/passive current levels (always the
 * unit's live synced values — see `prefillFrom`) and an independent Target level for each track.
 * A single Ability goal may raise one track or both; a track whose Target is at or below its own
 * current level simply doesn't move (see `abilityActiveEnd`/`abilityPassiveEnd` below). Until the user
 * picks a track's Target it follows `firstFreeTarget` (both tracks up a level, skipping in-flight
 * targets in `taken`).
 */
export function useAbilityFields(
  taken: ReadonlySet<string> = NO_TAKEN_TARGETS
) {
  const [abilityActiveStart, setAbilityActiveStart] = useState(0)
  const [abilityPassiveStart, setAbilityPassiveStart] = useState(0)
  const [activePicked, setActivePicked] = useState<number | null>(null)
  const [passivePicked, setPassivePicked] = useState<number | null>(null)

  const defaults = firstFreeTarget(
    "Ability",
    { active: abilityActiveStart, passive: abilityPassiveStart },
    taken
  )
  const abilityActiveTarget = activePicked ?? defaults.active
  const abilityPassiveTarget = passivePicked ?? defaults.passive

  // Never a regression below either track's own current level — a track whose selected Target is
  // at or below its current level has nothing left to farm for this goal.
  const abilityActiveEnd = Math.max(abilityActiveStart, abilityActiveTarget)
  const abilityPassiveEnd = Math.max(abilityPassiveStart, abilityPassiveTarget)

  const reset = () => {
    setAbilityActiveStart(0)
    setAbilityPassiveStart(0)
    setActivePicked(null)
    setPassivePicked(null)
  }

  // Applies the synced current-ability-level prefill once per entity selection — called from the
  // once-per-unit entity prefill (see use-entity-prefill.ts), not on every render.
  const prefillFrom = (activeLevel: number, passiveLevel: number) => {
    setAbilityActiveStart(activeLevel)
    setAbilityPassiveStart(passiveLevel)
    setActivePicked(null)
    setPassivePicked(null)
  }

  return {
    state: {
      abilityActiveStart,
      abilityActiveEnd,
      abilityActiveTarget,
      setAbilityActiveTarget: (level: number) => setActivePicked(level),
      abilityPassiveStart,
      abilityPassiveEnd,
      abilityPassiveTarget,
      setAbilityPassiveTarget: (level: number) => setPassivePicked(level),
    },
    reset,
    prefillFrom,
  }
}

const NO_TAKEN_TARGETS: ReadonlySet<string> = new Set()

/**
 * The Rank goal's own target-range state — a read-only start rank (always the unit's live synced
 * rank, set only via `prefillFrom` — never user-editable), the target rank, the target rank's
 * "Additional target" (V1's Point Five / Mythic-tier partial-upgrade selection, see
 * rank-additional-target.ts), and the option lists each select offers. Until the user picks a target
 * above the start it follows `firstFreeTarget`, skipping in-flight targets in `taken`.
 */
export function useRankFields(taken: ReadonlySet<string> = NO_TAKEN_TARGETS) {
  const [rankStart, setRankStart] = useState<Rank>(firstRank)
  const [picked, setPicked] = useState<Rank | null>(null)
  const [rankAdditionalTarget, setRankAdditionalTarget] =
    useState<RankAdditionalTarget>("None")

  const rankEnd =
    picked && rankIndex(picked) >= rankIndex(rankStart)
      ? picked
      : firstFreeTarget("Rank", rankStart, taken)
  const rankEndOptions = useMemo(
    () => rankOptionsAbove(rankIndex(rankStart)),
    [rankStart]
  )
  const additionalTargetChoices = useMemo(
    () => additionalTargetOptions(rankEnd),
    [rankEnd]
  )

  // Changing the target rank can invalidate the selected Additional target (e.g. moving off a
  // Mythic-tier rank drops its numbered partial options) — reset to None rather than leave a
  // selection the new rank doesn't actually offer.
  const setRankEnd = (rank: Rank) => {
    setPicked(rank)
    setRankAdditionalTarget("None")
  }

  const reset = () => {
    setRankStart(firstRank)
    setPicked(null)
    setRankAdditionalTarget("None")
  }

  // Applies the synced current-rank prefill once per entity selection — called from the parent's
  // once-per-unit entity prefill (see use-entity-prefill.ts), not on every render. Uses
  // functional no-op updaters when `rank` is undefined (a Mow) so the caller can call this
  // unconditionally, matching that effect's own set-state-in-effect lint idiom. `rankStart` is
  // never otherwise settable — the "From" field always reflects this synced value.
  const prefillFrom = (rank: Rank | undefined) => {
    setRankStart((current) => rank ?? current)
    setRankAdditionalTarget("None")
  }

  return {
    state: {
      rankStart,
      rankEnd,
      setRankEnd,
      rankEndOptions,
      rankAdditionalTarget,
      setRankAdditionalTarget,
      additionalTargetChoices,
    },
    reset,
    prefillFrom,
  }
}

/**
 * How many of the current rank's own upgrade slots are already applied — the small "3/6" badge
 * next to the read-only "Current rank" field. `rankUpgradeSlotsTotal` comes from the catalog (so it's known
 * even for a locked/unowned character); `rankAppliedUpgrades` is 0 until synced player data
 * resolves, deduplicated and capped the same way the backend's achievement check treats
 * `appliedUpgradeSlots` (`GoalAchievementEvaluator.RankAchieved`'s `.Distinct().Count()`).
 */
function useRankUpgradeSlotsSummary(
  character:
    { rankUpUpgrades: { rank: Rank; upgradeIds: UpgradeId[] }[] } | undefined,
  rankStart: Rank,
  playerCharacter: { appliedUpgradeSlots: number[] } | undefined
) {
  const rankUpgradeSlotsTotal =
    character?.rankUpUpgrades.find((entry) => entry.rank === rankStart)
      ?.upgradeIds.length ?? 0
  const rankAppliedUpgrades = Math.min(
    playerCharacter ? new Set(playerCharacter.appliedUpgradeSlots).size : 0,
    rankUpgradeSlotsTotal
  )

  return { rankUpgradeSlotsTotal, rankAppliedUpgrades }
}

type CreationPreviewParams = Parameters<typeof computeCreationPreview>[0]

/**
 * Memoized wrapper around `computeCreationPreview` (plan §9 context (a): resource-requirement
 * preview + isolated day-by-day estimate); the calc itself stays pure in ./goal-preview.ts.
 */
function useCreationPreview(params: CreationPreviewParams) {
  const {
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
    abilityActiveStart,
    abilityActiveEnd,
    abilityPassiveStart,
    abilityPassiveEnd,
    inventoryUpgrades,
    upgradesById,
    battlesById,
    dailyEnergy,
  } = params
  return useMemo(
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
        abilityActiveStart,
        abilityActiveEnd,
        abilityPassiveStart,
        abilityPassiveEnd,
        inventoryUpgrades,
        upgradesById,
        battlesById,
        dailyEnergy,
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
      abilityActiveStart,
      abilityActiveEnd,
      abilityPassiveStart,
      abilityPassiveEnd,
      inventoryUpgrades,
      upgradesById,
      battlesById,
      dailyEnergy,
    ]
  )
}

/**
 * The merged Unit picker's locked-id set (plan: goal-creation combobox lock badge) — every
 * catalog id minus whatever's actually synced to the caller's roster. `undefined` until both the
 * catalog groups and the synced roster have loaded, so the combobox shows no locked state (rather
 * than a flash of "everything locked") during the initial load. No auth check here — the
 * caller (`CreateGoalSheet`) only ever mounts once `AppShell` has confirmed the user is signed in.
 */
function useLockedUnitIds(
  characterGroups: FactionGroup[],
  mowGroups: FactionGroup[]
): ReadonlySet<UnitId> | undefined {
  const ownedCharacters = readyData(
    usePlayerChunk("characters", chunkOrUndefined)
  )
  const ownedMows = readyData(usePlayerChunk("mows", chunkOrUndefined))
  // Built off characterGroups/mowGroups (not charactersById/mowsById directly) since those already
  // carry a properly branded `UnitId` per member — the raw catalog maps are keyed by plain `string`.
  const lockedCharacterIds = useMemo(() => {
    if (!ownedCharacters) return undefined
    const owned = new Set(ownedCharacters.map((c) => c.unitId))
    return new Set(
      characterGroups
        .flatMap((group) => group.members)
        .map((member) => member.id)
        .filter((id) => !owned.has(id))
    )
  }, [characterGroups, ownedCharacters])
  const lockedMowIds = useMemo(() => {
    if (!ownedMows) return undefined
    const owned = new Set(ownedMows.map((m) => m.unitId))
    return new Set(
      mowGroups
        .flatMap((group) => group.members)
        .map((member) => member.id)
        .filter((id) => !owned.has(id))
    )
  }, [mowGroups, ownedMows])

  return useMemo(
    () =>
      lockedCharacterIds && lockedMowIds
        ? new Set([...lockedCharacterIds, ...lockedMowIds])
        : undefined,
    [lockedCharacterIds, lockedMowIds]
  )
}

/**
 * The Create Goal drawer's project-membership selection. A newly opened
 * form derives its initial membership from the last successfully created goal's
 * choice (transient, in-memory: a reload starts over), else the user's default
 * project. An explicit selection (prefill or the user's own edit) always wins.
 */
export function useProjectSelection({ open }: { open: boolean }) {
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [rememberedProjectIds, setRememberedProjectIds] = useState<string[]>([])

  const projectsQuery = useQuery({
    ...projectQueries.list(),
    enabled: open,
  })
  const projects = projectsQuery.data?.projects ?? []
  const defaultProjectId = projects.find(
    (project) => project.isDefault
  )?.projectId
  // Drop prefilled IDs (e.g. from a stale project URL) that aren't the account's projects.
  const validSelectedProjectIds = projectsQuery.isSuccess
    ? selectedProjectIds.filter((id) =>
        projects.some((project) => project.projectId === id)
      )
    : selectedProjectIds
  // A remembered project archived or removed since is ignored rather than offered or submitted.
  const validRememberedProjectIds = projectsQuery.isSuccess
    ? rememberedProjectIds.filter((id) =>
        projects.some(
          (project) => project.projectId === id && project.status !== "Archived"
        )
      )
    : []
  const effectiveProjectIds =
    validSelectedProjectIds.length > 0
      ? validSelectedProjectIds
      : open && validRememberedProjectIds.length > 0
        ? validRememberedProjectIds
        : open && defaultProjectId
          ? [defaultProjectId]
          : []

  const selectProjects = (projectIds: readonly string[]) => {
    setSelectedProjectIds([...projectIds])
  }

  // Snapshots what was just submitted so the next creation starts from it; `reset` then clears the
  // explicit selection, which lets the remembered ids show through.
  const remember = () => {
    setRememberedProjectIds(effectiveProjectIds)
  }

  const reset = () => {
    setSelectedProjectIds([])
  }

  return {
    projects,
    selectedProjectIds: effectiveProjectIds,
    selectProjects,
    remember,
    reset,
  }
}
