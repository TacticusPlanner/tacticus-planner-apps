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

import { createCombinedGoals, type GoalKind } from "@/entities/goal"
import { listProjects, type ProjectSummary } from "@/entities/project"
import { ApiError } from "@/shared/api"

import { estimateGoal } from "./estimate/estimate"
import { DAILY_ENERGY } from "./estimate/estimate.domain"
import {
  buildCombinedGoalSpecs,
  buildReviewItems,
  computeMissingUpgrades,
} from "./goal-spec-builder"
import { useGoalCatalog } from "./use-goal-catalog"
import { useGoalPrefill } from "./use-goal-prefill"
import { useGoalPrerequisites } from "./use-goal-prerequisites"

const DEFAULT_PROJECT_VALUE = "__default__"

/**
 * Everything CreateGoalSheet needs to render: catalog data, per-field form state, the synced-data
 * prefill effect, the Rank-goal resource preview, and the submit handler. Split out of the UI
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

  const {
    charactersById,
    upgradesById,
    battlesById,
    characterGroups,
    getCharacter,
  } = useGoalCatalog()
  const inventoryUpgrades = useLiveQuery(() => getInventoryUpgrades(), [])

  const [characterId, setCharacterId] = useState<UnitId | undefined>(undefined)
  const [enabledTypes, setEnabledTypes] = useState<ReadonlySet<GoalKind>>(
    () => new Set<GoalKind>(["Rank"])
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

  const { playerCharacter } = useGoalPrefill(characterId)

  // Applies the synced rank/progression prefill once per character selection, mirroring
  // character-lookup-page.tsx's ref-guard: never on a later background refresh, so it can't
  // clobber edits the user has since made to the target fields.
  const prefilledCharacterIdRef = useRef<UnitId | undefined>(undefined)
  useEffect(() => {
    if (
      !characterId ||
      !playerCharacter ||
      prefilledCharacterIdRef.current === characterId
    ) {
      return
    }
    prefilledCharacterIdRef.current = characterId

    setRankStart(playerCharacter.rank)
    setRankEnd((current) =>
      rankIndex(current) > rankIndex(playerCharacter.rank)
        ? current
        : rankAt(
            Math.min(rankIndex(playerCharacter.rank) + 1, rankIndex(lastRank))
          )
    )
    setProgressionStart(playerCharacter.progressionIndex)
    setProgressionEnd((current) =>
      progressionIndex(current) >
      progressionIndex(playerCharacter.progressionIndex)
        ? current
        : playerCharacter.progressionIndex
    )
  }, [characterId, playerCharacter])

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

  const resetForm = () => {
    setCharacterId(undefined)
    setEnabledTypes(new Set(["Rank"]))
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
    setProjectId(DEFAULT_PROJECT_VALUE)
    prefilledCharacterIdRef.current = undefined
  }

  const handleCharacterChange = (id: UnitId) => {
    setCharacterId(id)
    setEnabledTypes(new Set(["Rank"]))
    setRankStart(firstRank)
    setRankEnd(rankAt(1))
    setRankStartPointFive(false)
    setRankEndPointFive(false)
    setProgressionStart(firstProgression)
    setProgressionEnd(firstProgression)
    prefilledCharacterIdRef.current = undefined
  }

  const rankEndOptions = useMemo(() => {
    const options = rankOrder.filter((r) => rankIndex(r) > rankIndex(rankStart))
    return options.length > 0 ? options : [rankStart]
  }, [rankStart])

  const character = characterId ? getCharacter(characterId) : undefined

  // Resource-requirement preview — pure calc in ./goal-spec-builder.ts (this file's max-lines budget).
  const missingUpgrades = useMemo(
    () =>
      computeMissingUpgrades({
        rankEnabled: enabledTypes.has("Rank"),
        character,
        rankStart,
        rankEnd,
        rankEndPointFive,
        playerCharacter,
        inventoryUpgrades,
        upgradesById,
      }),
    [
      enabledTypes,
      character,
      rankStart,
      rankEnd,
      rankEndPointFive,
      playerCharacter,
      inventoryUpgrades,
      upgradesById,
    ]
  )

  // Isolated day-by-day estimate for the same Rank range (plan §9 context (a) — computed on its own,
  // not inserted into any project's schedule). `null` outside a valid Rank range; otherwise built from
  // `missingUpgrades` (already required-minus-owned) so the two previews never disagree with each
  // other, and `estimateGoal` itself reports `days: 0` once nothing is missing.
  const estimatePreview = useMemo(() => {
    if (
      !enabledTypes.has("Rank") ||
      !character ||
      rankIndex(rankStart) >= rankIndex(rankEnd)
    ) {
      return null
    }

    return estimateGoal({
      needs: missingUpgrades.map((entry) => ({
        id: entry.id,
        count: entry.missing,
      })),
      upgradesById,
      battlesById,
      dailyEnergy: DAILY_ENERGY,
    })
  }, [
    enabledTypes,
    character,
    rankStart,
    rankEnd,
    missingUpgrades,
    upgradesById,
    battlesById,
  ])

  // Combined-creation prerequisite detection (plan §6) — a locked character needs Unlock first; a
  // Rank target beyond what the character's current Ascension allows needs Ascension first. Reruns
  // whenever the toggled types or their targets change.
  const prerequisites = useGoalPrerequisites({
    isLocked: !!characterId && !playerCharacter,
    currentProgression: playerCharacter?.progressionIndex,
    enabledTypes,
    rankEnd,
  })

  // Whether Unlock will actually be submitted — either the user toggled it explicitly, or it's
  // required as a prerequisite for another enabled type on a locked character.
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

  const canSubmit =
    !!characterId &&
    enabledTypes.size > 0 &&
    (!enabledTypes.has("Rank") || rankIndex(rankStart) < rankIndex(rankEnd)) &&
    (!enabledTypes.has("Ascension") ||
      progressionIndex(progressionStart) < progressionIndex(progressionEnd)) &&
    (!enabledTypes.has("Shards") || shardsCount > 0)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!account || !characterId || !canSubmit) {
      return
    }

    setStatus("submitting")
    setErrorMessage(null)

    try {
      await createCombinedGoals(instance, account, {
        entityType: "Character",
        entityId: characterId,
        projectId: projectId === DEFAULT_PROJECT_VALUE ? undefined : projectId,
        goals: buildCombinedGoalSpecs({
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
        }),
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
    characterGroups,
    characterId,
    handleCharacterChange,
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
    canSubmit,
    handleSubmit,
  }
}
