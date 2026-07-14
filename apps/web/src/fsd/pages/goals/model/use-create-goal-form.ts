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

import {
  aggregateBaseUpgrades,
  aggregateOwnedBaseUpgrades,
  appliedUpgradeIds,
  rankUpUpgradeIds,
} from "@/features/rank-lookup"
import {
  createGoal,
  type CreateGoalConfigRequest,
  type GoalKind,
} from "@/entities/goal"
import { listProjects, type ProjectSummary } from "@/entities/project"
import { ApiError } from "@/shared/api"

import { estimateGoal } from "./estimate/estimate"
import { DAILY_ENERGY } from "./estimate/estimate.domain"
import { useGoalCatalog } from "./use-goal-catalog"
import { useGoalPrefill } from "./use-goal-prefill"

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
  const [goalType, setGoalType] = useState<GoalKind>("Rank")

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

  const resetForm = () => {
    setCharacterId(undefined)
    setGoalType("Rank")
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
    setGoalType("Rank")
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

  // Resource-requirement preview (Rank goals only, plan §16 phase 2 scope decision — Ascension/
  // Ability/Shards/Unlock have no analogous "required vs owned" calc reused anywhere yet).
  const missingUpgrades = useMemo(() => {
    if (
      goalType !== "Rank" ||
      !character ||
      rankIndex(rankStart) >= rankIndex(rankEnd)
    ) {
      return []
    }

    const requiredIds = rankUpUpgradeIds(
      character,
      rankStart,
      rankEnd,
      rankEndPointFive
    )
    const required = aggregateBaseUpgrades(requiredIds, upgradesById)

    const appliedIds = playerCharacter
      ? appliedUpgradeIds(
          character,
          playerCharacter.rank,
          playerCharacter.appliedUpgradeSlots
        )
      : []
    const owned = aggregateOwnedBaseUpgrades(
      appliedIds,
      (inventoryUpgrades ?? []).map((entry) => ({
        id: entry.upgradeId,
        amount: entry.amount,
      })),
      upgradesById
    )
    const ownedById = new Map(owned.map((entry) => [entry.id, entry.count]))

    return required
      .map((need) => ({
        id: need.id,
        label: upgradesById.get(need.id)?.label ?? need.id,
        missing: Math.max(0, need.count - (ownedById.get(need.id) ?? 0)),
      }))
      .filter((entry) => entry.missing > 0)
  }, [
    goalType,
    character,
    rankStart,
    rankEnd,
    rankEndPointFive,
    playerCharacter,
    inventoryUpgrades,
    upgradesById,
  ])

  // Isolated day-by-day estimate for the same Rank range (plan §9 context (a) — computed on its own,
  // not inserted into any project's schedule). `null` outside a valid Rank range; otherwise built from
  // `missingUpgrades` (already required-minus-owned) so the two previews never disagree with each
  // other, and `estimateGoal` itself reports `days: 0` once nothing is missing.
  const estimatePreview = useMemo(() => {
    if (
      goalType !== "Rank" ||
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
    goalType,
    character,
    rankStart,
    rankEnd,
    missingUpgrades,
    upgradesById,
    battlesById,
  ])

  const canSubmit =
    !!characterId &&
    (goalType !== "Rank" || rankIndex(rankStart) < rankIndex(rankEnd)) &&
    (goalType !== "Ascension" ||
      progressionIndex(progressionStart) < progressionIndex(progressionEnd)) &&
    (goalType !== "Shards" || shardsCount > 0)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!account || !characterId || !canSubmit) {
      return
    }

    setStatus("submitting")
    setErrorMessage(null)

    const config: CreateGoalConfigRequest = {}
    if (goalType === "Rank") {
      config.rank = {
        start: rankIndex(rankStart),
        startPointFive: rankStartPointFive,
        startAppliedUpgrades: 0,
        end: rankIndex(rankEnd),
        endPointFive: rankEndPointFive,
        endAppliedUpgrades: 0,
      }
    } else if (goalType === "Ascension") {
      config.progression = { start: progressionStart, end: progressionEnd }
    } else if (goalType === "Ability") {
      config.ability = {
        activeStart: abilityActiveStart,
        activeEnd: abilityActiveEnd,
        passiveStart: abilityPassiveStart,
        passiveEnd: abilityPassiveEnd,
      }
    } else if (goalType === "Shards") {
      config.shards = { count: shardsCount }
    }

    try {
      await createGoal(instance, account, {
        entityType: "Character",
        entityId: characterId,
        goalType,
        config,
        projectId: projectId === DEFAULT_PROJECT_VALUE ? undefined : projectId,
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
    goalType,
    setGoalType,
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
