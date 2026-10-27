import { useState, useMemo, useEffect, useRef } from "react"
import {
  type UnitId,
  firstProgression,
  progressionIndex,
  type Progression,
  firstRank,
  rankIndex,
  type Rank,
  type UpgradeId,
  type FactionGroup,
} from "@workspace/game-domain"
import type { FarmingStrategy, GoalKind } from "@/entities/goal"
import { usePlanningSettings } from "@/entities/planning-setting"
import { usePlayerChunk } from "@/shared/local-data"
import {
  additionalTargetSelection,
  useUnitShopShardSupply,
  additionalTargetOptions,
  type RankAdditionalTarget,
} from "@/features/goal-farming/@x/goal-create"
import { useAcquisitionSourceSelection } from "./use-acquisition-source-selection"
import { useMythicMaterialSelection } from "./use-mythic-material-selection"
import { useEntityShardSummary } from "./use-entity-shard-summary"
import {
  useGoalCatalog,
  chunkOrUndefined,
  readyData,
  toXpBooks,
  goalKindsForEntity,
  isAtMaxAbility,
  isAtMaxProgression,
  isAtMaxRank,
} from "@/features/goal-planning/@x/goal-create"
import { useGoalFormReset } from "./use-goal-form-reset"
import { useGoalPrefill } from "./use-goal-prefill"
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
import {
  progressionEndOptionsFor,
  rankOptionsAbove,
} from "../target-edit/goal-target-edit"
import { useQuery } from "@tanstack/react-query"
import { useGlobalGoalPlan } from "@/entities/goal"
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
    topRowCount: rankEndTopRowCount,
  } = additionalTargetSelection(rankAdditionalTarget)

  const { rankUpgradeSlotsTotal, rankAppliedUpgrades } =
    useRankUpgradeSlotsSummary(character, rankStart, playerCharacter)

  const ascensionFields = useAscensionFields(takenTargets.takenFor("Ascension"))
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
  const { upgradeTargets, upgradeRanges } = upgradeFields.state

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
    character:
      entityType === "Character" && entityId
        ? charactersById?.get(entityId)
        : undefined,
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
    rankStart,
    rankEnd,
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
    upgradeRanges,
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
      missingUpgrades: snapshotUpgrades,
    },
    onOpenChange,
    resetForm,
  })

  const { slotConflictIssue, ...submissionState } = submission
  // Every blocking problem, in card order (goal-creation: shown inline and counted beside submit).
  const goalKinds = goalKindsForEntity(entityType)
  const issues = [
    ...formIssues,
    ...(slotConflictIssue ? [slotConflictIssue] : []),
  ].sort((a, b) => goalKinds.indexOf(a.kind) - goalKinds.indexOf(b.kind))

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
  // parent's single ref-guarded prefill effect (see use-create-goal-form.ts), not on every render.
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
 * The Ascension goal's own target-range state — a read-only start progression (always the unit's
 * live synced progression, never user-editable — see `prefillFrom`) and the target progression
 * step. Until the user picks a target above the start it follows `firstFreeTarget` — the next step,
 * skipping in-flight targets in `taken` — so it never defaults to the current progression. The
 * shard-source selection (Campaigns/Onslaught/Shops) lives in `useAcquisitionSourceSelection`
 * instead — it's shared with Unlock, not Ascension-specific.
 */
export function useAscensionFields(
  taken: ReadonlySet<string> = NO_TAKEN_TARGETS
) {
  const [progressionStart, setProgressionStart] =
    useState<Progression>(firstProgression)
  const [picked, setPicked] = useState<Progression | null>(null)

  const progressionEnd =
    picked && progressionIndex(picked) > progressionIndex(progressionStart)
      ? picked
      : firstFreeTarget("Ascension", progressionStart, taken)
  const progressionEndOptions = useMemo(
    () => progressionEndOptionsFor(progressionStart),
    [progressionStart]
  )

  const reset = () => {
    setProgressionStart(firstProgression)
    setPicked(null)
  }

  // Applies the synced current-progression prefill once per entity selection — called from the
  // parent's single ref-guarded prefill effect (see use-create-goal-form.ts), not on every render.
  // `progressionStart` is never otherwise settable — the "From" field always reflects this synced
  // value. A target picked (or prefilled) before it arrived stays while it is above the start.
  const prefillFrom = (progression: Progression) => {
    setProgressionStart(progression)
  }

  return {
    state: {
      progressionStart,
      progressionEnd,
      progressionEndOptions,
      setProgressionEnd: (value: Progression) => setPicked(value),
    },
    reset,
    prefillFrom,
  }
}

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
    picked && rankIndex(picked) > rankIndex(rankStart)
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
  // single ref-guarded prefill effect (see use-create-goal-form.ts), not on every render. Uses
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
  return useMemo(
    () => computeCreationPreview(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      params.entityType,
      params.enabledTypes,
      params.character,
      params.mow,
      params.playerCharacter,
      params.playerMow,
      params.rankStart,
      params.rankEnd,
      params.rankEndPointFive,
      params.rankEndAppliedUpgrades,
      params.rankEndTopRowCount,
      params.abilityActiveStart,
      params.abilityActiveEnd,
      params.abilityPassiveStart,
      params.abilityPassiveEnd,
      params.inventoryUpgrades,
      params.upgradesById,
      params.battlesById,
      params.dailyEnergy,
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

type FieldsWithPrefill<TArgs extends unknown[]> = {
  prefillFrom: (...args: TArgs) => void
}

/**
 * Applies the synced rank/progression/ability prefill once per entity selection, mirroring
 * character-lookup-page.tsx's ref-guard: never on a later background refresh, so it can't clobber
 * edits the user has since made to the target fields. Delegates the actual field-level update to
 * each sub-hook's own `prefillFrom`, so this effect only coordinates *when*, not *how*. Returns the guard ref
 * itself so the parent can also clear it on an explicit entity change / form reset.
 */
function useEntityPrefillEffect({
  entityId,
  playerEntity,
  rank,
  rankFields,
  upgradeFields,
  ascensionFields,
  abilityFields,
  setEnabledTypes,
}: {
  entityId: UnitId | undefined
  playerEntity:
    | { progressionIndex: Progression; abilities?: { level: number }[] }
    | undefined
  rank: Rank | undefined
  rankFields: FieldsWithPrefill<[Rank | undefined]>
  upgradeFields: FieldsWithPrefill<[Rank | undefined]>
  ascensionFields: FieldsWithPrefill<[Progression]>
  abilityFields: FieldsWithPrefill<[number, number]>
  setEnabledTypes: (
    updater: (current: ReadonlySet<GoalKind>) => ReadonlySet<GoalKind>
  ) => void
}) {
  const prefilledEntityIdRef = useRef<UnitId | undefined>(undefined)

  useEffect(() => {
    if (
      !entityId ||
      !playerEntity ||
      prefilledEntityIdRef.current === entityId
    ) {
      return
    }
    prefilledEntityIdRef.current = entityId

    // A MoW has no `rank` (plan §16 phase 6) — `rank` is `undefined` there, so these no-op via
    // their functional updaters instead of being wrapped in an `if`, which the set-state-in-effect
    // lint rule can't recognize as the safe "sync on selection change" idiom.
    rankFields.prefillFrom(rank)
    upgradeFields.prefillFrom(rank)
    ascensionFields.prefillFrom(playerEntity.progressionIndex)
    const activeLevel = playerEntity.abilities?.[0]?.level ?? 1
    const passiveLevel = playerEntity.abilities?.[1]?.level ?? 1
    abilityFields.prefillFrom(activeLevel, passiveLevel)

    // A toggle the user enabled (or a remembered goal type carried over from the previous creation)
    // before this synced data loaded may turn out to be unavailable once it arrives — an owned unit
    // cannot be unlocked, and maxed-out targets have nowhere to go. Strip it rather than leave a
    // checked-but-disabled toggle sitting in the form. Always called (a no-op functional updater when nothing's maxed) for the same lint-idiom
    // reason as the setState calls above — a conditionally-called setState inside an effect trips
    // the set-state-in-effect rule.
    const rankMaxed = isAtMaxRank(rank)
    const abilityMaxed = isAtMaxAbility(
      playerEntity.progressionIndex,
      activeLevel,
      passiveLevel
    )
    const progressionMaxed = isAtMaxProgression(playerEntity.progressionIndex)
    setEnabledTypes((current) => {
      const next = new Set(current)
      // Reaching this effect means the unit is owned, so Unlock is never available.
      next.delete("Unlock")
      if (rankMaxed) {
        next.delete("Rank")
        next.delete("Upgrade")
      }
      if (abilityMaxed) next.delete("Ability")
      if (progressionMaxed) next.delete("Ascension")
      return next
    })
    // rankFields/ascensionFields/abilityFields/upgradeFields are freshly returned every render (not
    // stable references) — their own state setters are, so depending on entityId/playerEntity/rank
    // alone (as before this hook was split) is correct here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, playerEntity, rank])

  return {
    resetPrefillGuard: () => {
      prefilledEntityIdRef.current = undefined
    },
  }
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
