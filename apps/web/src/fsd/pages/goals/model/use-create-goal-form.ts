import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useLiveQuery } from "dexie-react-hooks"

import { useMsal } from "@azure/msal-react"
import {
  firstProgression,
  firstRank,
  lastRank,
  progressionIndex,
  rankAt,
  rankIndex,
  rankOrder,
  type Progression,
  type Rank,
  type UnitId,
} from "@workspace/game-domain"
import { getInventoryUpgrades } from "@workspace/player-data/queries"
import type { PlayerDataChunkDto } from "@workspace/player-data"

import { createCombinedGoals, type GoalKind } from "@/entities/goal"
import { usePlanningSettings } from "@/entities/planning-setting"
import { listProjects, type ProjectSummary } from "@/entities/project"
import { ApiError } from "@/shared/api"

import { computeCreationPreview } from "./goal-preview"
import { buildCombinedGoalSpecs, buildReviewItems } from "./goal-spec-builder"
import { useGoalCatalog } from "./use-goal-catalog"
import { useGoalPrefill } from "./use-goal-prefill"
import { useGoalPrerequisites } from "./use-goal-prerequisites"
import { mowAbilityTrackLevel } from "./mow-ability-calc"
import { buildCreateGoalSnapshot } from "./goal-snapshot-builder"
import { getGoalValidationIssue } from "./goal-validation"

const DEFAULT_PROJECT_VALUE = "__default__"

export type EntityType = "Character" | "Mow"

const defaultTypesFor = (entityType: EntityType): Set<GoalKind> =>
  new Set(entityType === "Mow" ? ["Ability"] : ["Rank"])

/**
 * Everything CreateGoalSheet needs to render: catalog data, per-field form state, the synced-data
 * prefill effect, the resource-requirement preview, and the submit handler. Split out of the UI
 * component so create-goal-sheet.tsx stays presentational (and under this repo's max-lines rule).
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
  const { t } = useTranslation()
  const { instance, accounts } = useMsal()
  const account = instance.getActiveAccount() ?? accounts[0]
  const { settings: planningSettings } = usePlanningSettings()

  const {
    charactersById,
    mowsById,
    upgradesById,
    battlesById,
    characterGroups,
    mowGroups,
    getCharacter,
    getMow,
  } = useGoalCatalog()
  const inventoryUpgrades = useLiveQuery(() => getInventoryUpgrades(), [])

  const [entityType, setEntityType] = useState<EntityType>("Character")
  const [entityId, setEntityId] = useState<UnitId | undefined>(undefined)
  const [enabledTypes, setEnabledTypes] = useState<ReadonlySet<GoalKind>>(() =>
    defaultTypesFor("Character")
  )

  const [rankStart, setRankStart] = useState<Rank>(firstRank)
  const [rankEnd, setRankEnd] = useState<Rank>(rankAt(1))
  const [rankStartPointFive, setRankStartPointFive] = useState(false)
  const [rankEndPointFive, setRankEndPointFive] = useState(false)

  const [progressionStart, setProgressionStart] =
    useState<Progression>(firstProgression)
  const [progressionEnd, setProgressionEnd] =
    useState<Progression>(firstProgression)

  const [abilityActiveStart, setAbilityActiveStart] = useState(0)
  const [abilityActiveEnd, setAbilityActiveEnd] = useState(0)
  const [abilityPassiveStart, setAbilityPassiveStart] = useState(0)
  const [abilityPassiveEnd, setAbilityPassiveEnd] = useState(0)

  const [shardsCount, setShardsCount] = useState(0)

  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [projectId, setProjectId] = useState(DEFAULT_PROJECT_VALUE)

  const [createAnother, setCreateAnother] = useState(false)
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { playerEntity } = useGoalPrefill(entityId, entityType)
  // A Character's synced record is the only one that ever carries `rank` (plan §16 phase 6 — a MoW
  // has no rank at all); `entityType` reliably discriminates which shape `playerEntity` actually is,
  // since useGoalPrefill fetched it based on that same value.
  // `playerEntity`'s runtime shape always matches `entityType` (useGoalPrefill fetched it based on
  // that same value) — TS can't correlate two separately-computed variables through the ternary
  // below, so the cast documents an invariant the types alone can't express.
  const playerCharacter =
    entityType === "Character"
      ? (playerEntity as PlayerDataChunkDto<"characters">[number] | undefined)
      : undefined
  const playerMow =
    entityType === "Mow"
      ? (playerEntity as PlayerDataChunkDto<"mows">[number] | undefined)
      : undefined

  // Applies the synced rank/progression prefill once per entity selection, mirroring
  // character-lookup-page.tsx's ref-guard: never on a later background refresh, so it can't
  // clobber edits the user has since made to the target fields.
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

    // A MoW has no `rank` (plan §16 phase 6) — `playerCharacter?.rank` is `undefined` there, so
    // these no-op via their functional updaters instead of being wrapped in an `if`, which the
    // set-state-in-effect lint rule can't recognize as the safe "sync on selection change" idiom.
    const rank = playerCharacter?.rank
    setRankStart((current) => rank ?? current)
    setRankEnd((current) => {
      if (!rank) return current
      return rankIndex(current) > rankIndex(rank)
        ? current
        : rankAt(Math.min(rankIndex(rank) + 1, rankIndex(lastRank)))
    })
    setProgressionStart(playerEntity.progressionIndex)
    setProgressionEnd((current) =>
      progressionIndex(current) >
      progressionIndex(playerEntity.progressionIndex)
        ? current
        : playerEntity.progressionIndex
    )
    const activeLevel = playerEntity.abilities?.[0]?.level ?? 1
    const passiveLevel = playerEntity.abilities?.[1]?.level ?? 1
    setAbilityActiveStart(activeLevel)
    setAbilityActiveEnd(activeLevel + 1)
    setAbilityPassiveStart(passiveLevel)
    setAbilityPassiveEnd(passiveLevel)
  }, [entityId, playerEntity, playerCharacter])

  useEffect(() => {
    if (!open || !account) {
      return
    }
    void listProjects(instance, account).then(
      (data) => setProjects(data.projects),
      () => setProjects([])
    )
  }, [open, instance, account])

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
    setRankStart(firstRank)
    setRankEnd(rankAt(1))
    setRankStartPointFive(false)
    setRankEndPointFive(false)
    setProgressionStart(firstProgression)
    setProgressionEnd(firstProgression)
    setAbilityActiveStart(0)
    setAbilityActiveEnd(0)
    setAbilityPassiveStart(0)
    setAbilityPassiveEnd(0)
    setShardsCount(0)
  }

  const resetForm = () => {
    setEntityType("Character")
    setEntityId(undefined)
    setEnabledTypes(defaultTypesFor("Character"))
    resetTargetFields()
    setProjectId(DEFAULT_PROJECT_VALUE)
    prefilledEntityIdRef.current = undefined
  }

  // Switching entity type (the Characters/MoW tabs, plan §7) clears the selection — Rank isn't
  // offered on the MoW tab at all (see create-goal-sheet.tsx), so the default toggle set differs.
  const handleEntityTypeChange = (type: EntityType) => {
    setEntityType(type)
    setEntityId(undefined)
    setEnabledTypes(defaultTypesFor(type))
    resetTargetFields()
    prefilledEntityIdRef.current = undefined
  }

  const handleEntityChange = (id: UnitId) => {
    setEntityId(id)
    setEnabledTypes(defaultTypesFor(entityType))
    resetTargetFields()
    prefilledEntityIdRef.current = undefined
  }

  const rankEndOptions = useMemo(() => {
    const options = rankOrder.filter((r) => rankIndex(r) > rankIndex(rankStart))
    return options.length > 0 ? options : [rankStart]
  }, [rankStart])

  const character =
    entityType === "Character" && entityId ? getCharacter(entityId) : undefined
  const mow = entityType === "Mow" && entityId ? getMow(entityId) : undefined

  // Resource-requirement preview + isolated day-by-day estimate (plan §9 context (a)) — pure calc in
  // ./goal-preview.ts, kept out of this file for its max-lines budget.
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

  // Combined-creation prerequisite detection (plan §6) — a locked entity needs Unlock first; a Rank
  // target beyond what a Character's current Ascension allows needs Ascension first (never triggers
  // for a MoW, since Rank is never in `enabledTypes` there). Reruns whenever the toggled types or
  // their targets change.
  const prerequisites = useGoalPrerequisites({
    isLocked: !!entityId && !playerEntity,
    currentProgression: playerEntity?.progressionIndex,
    enabledTypes,
    rankEnd,
  })

  // Whether Unlock will actually be submitted — either the user toggled it explicitly, or it's
  // required as a prerequisite for another enabled type on a locked entity.
  const includesUnlock = enabledTypes.has("Unlock") || prerequisites.needsUnlock
  // Whether Ascension will actually be submitted — either explicit, or the auto-suggested one.
  const includesAscension =
    enabledTypes.has("Ascension") || !!prerequisites.needsAscension

  // "What will be created" review list (plan §7) — in submit order, flagging entries the user didn't
  // explicitly toggle themselves. Pure builder in ./goal-spec-builder.ts (this file's own max-lines
  // budget) — same for the submit-time spec list below.
  const reviewItems = useMemo(
    () => buildReviewItems(enabledTypes, includesUnlock, includesAscension),
    [enabledTypes, includesUnlock, includesAscension]
  )

  const currentActiveAbility =
    entityType === "Mow"
      ? mowAbilityTrackLevel(playerMow, "primary")
      : (playerCharacter?.abilities?.[0]?.level ?? 1)
  const currentPassiveAbility =
    entityType === "Mow"
      ? mowAbilityTrackLevel(playerMow, "secondary")
      : (playerCharacter?.abilities?.[1]?.level ?? 1)
  const validationIssue = getGoalValidationIssue({
    hasEntityId: !!entityId,
    enabledTypes,
    isOwned: !!playerEntity,
    currentRank: playerCharacter?.rank,
    rankEnd,
    currentProgression: playerEntity?.progressionIndex,
    progressionEnd,
    abilityActiveStart,
    abilityActiveEnd,
    abilityPassiveStart,
    abilityPassiveEnd,
    currentActiveAbility,
    currentPassiveAbility,
  })
  const validationMessage = validationIssue
    ? t(`goals.create.validation.${validationIssue}`)
    : null

  const canSubmit =
    !!entityId &&
    enabledTypes.size > 0 &&
    !validationMessage &&
    (!enabledTypes.has("Rank") || rankIndex(rankStart) < rankIndex(rankEnd)) &&
    (!enabledTypes.has("Ascension") ||
      progressionIndex(progressionStart) < progressionIndex(progressionEnd)) &&
    (!enabledTypes.has("Shards") || shardsCount > 0)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!account || !entityId || !canSubmit) {
      return
    }

    setStatus("submitting")
    setErrorMessage(null)

    try {
      const specs = buildCombinedGoalSpecs({
        enabledTypes,
        includesUnlock,
        includesAscension,
        ascensionSuggestion: prerequisites.needsAscension,
        rankStart,
        rankEnd,
        rankStartPointFive,
        rankEndPointFive,
        progressionStart,
        progressionEnd,
        abilityActiveStart,
        abilityActiveEnd,
        abilityPassiveStart,
        abilityPassiveEnd,
        shardsCount,
      })
      await createCombinedGoals(instance, account, {
        entityType,
        entityId,
        projectId: projectId === DEFAULT_PROJECT_VALUE ? undefined : projectId,
        goals: specs.map((spec) => ({
          ...spec,
          snapshot: buildCreateGoalSnapshot({
            spec,
            entityType,
            playerEntity,
            playerCharacter,
            currentActiveAbility,
            currentPassiveAbility,
            missingUpgrades: snapshotUpgrades,
            estimatePreview,
          }),
        })),
      })

      if (createAnother) {
        resetForm()
        setStatus("idle")
      } else {
        onOpenChange(false)
        onCreated()
      }
    } catch (error) {
      setStatus("error")
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : t("goals.create.genericError")
      )
    }
  }

  return {
    account,
    charactersById,
    mowsById,
    characterGroups,
    mowGroups,
    entityType,
    handleEntityTypeChange,
    entityId,
    handleEntityChange,
    enabledTypes,
    toggleType,
    prerequisites,
    reviewItems,
    rankStart,
    setRankStart,
    rankEnd,
    setRankEnd,
    rankEndOptions,
    rankStartPointFive,
    setRankStartPointFive,
    rankEndPointFive,
    setRankEndPointFive,
    progressionStart,
    setProgressionStart,
    progressionEnd,
    setProgressionEnd,
    abilityActiveStart,
    setAbilityActiveStart,
    abilityActiveEnd,
    setAbilityActiveEnd,
    abilityPassiveStart,
    setAbilityPassiveStart,
    abilityPassiveEnd,
    setAbilityPassiveEnd,
    shardsCount,
    setShardsCount,
    projects,
    projectId,
    setProjectId,
    defaultProjectValue: DEFAULT_PROJECT_VALUE,
    createAnother,
    setCreateAnother,
    status,
    errorMessage,
    missingUpgrades,
    estimatePreview,
    validationMessage,
    canSubmit,
    handleSubmit,
  }
}
