import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useIsAuthenticated } from "@azure/msal-react"
import { useLiveQuery } from "dexie-react-hooks"
import { getOnslaughtRewards } from "@workspace/game-catalog/queries"
import type { Progression, UnitId } from "@workspace/game-domain"
import { getPlayerCharacter } from "@workspace/player-data/queries"

import type { AcquisitionSource, GoalDetail } from "@/entities/goal"
import { onslaughtProgressQueries } from "@/entities/player-data-override"
import {
  estimateGoal,
  isMythicProgression,
  ONSLAUGHT_RUNS_PER_DAY,
  useUnitShopShardSupply,
} from "@/features/goal-farming"

import {
  acquisitionSourceSeed,
  acquisitionSourcesFromPlan,
} from "../goal-creation-form/acquisition-plan"
import { onslaughtShardsPerRun } from "../goal-creation-form/onslaught-yield"
import { useAcquisitionSourceSelection } from "../goal-creation-form/use-acquisition-source-selection"
import type { useGoalCatalog } from "../shared/use-goal-catalog"

type CharactersById = ReturnType<typeof useGoalCatalog>["charactersById"]
type UnlockShardCostsById = ReturnType<
  typeof useGoalCatalog
>["unlockShardCostsById"]
type BattlesById = Parameters<typeof estimateGoal>[0]["battlesById"]

/**
 * Unlock/Ascension's acquisition-source picker wiring (Campaigns/Onslaught/Shops), seeded once from the
 * goal's saved config when the form mounts (the form mounts only after the goal and catalog loaded).
 * Returns the picker's live selection, the sources it would save (`null` for kinds without the picker)
 * and the baseline those are compared against.
 */
export function useGoalEditAcquisition({
  detail,
  charactersById,
  unlockShardCostsById,
  battlesById,
  dailyEnergy,
}: {
  detail: GoalDetail
  charactersById: CharactersById
  unlockShardCostsById: UnlockShardCostsById
  battlesById: BattlesById
  dailyEnergy: number
}) {
  const isUnlock = detail.goalType === "Unlock"
  const isAscension = detail.goalType === "Ascension"
  const usesAcquisitionSources = isUnlock || isAscension
  const characterView =
    detail.entityType === "Character"
      ? charactersById?.get(detail.entityId)
      : undefined
  const regularShardLocations = useMemo(
    () => characterView?.shardLocations.filter((l) => !l.isMythic) ?? [],
    [characterView]
  )
  const mythicShardLocations = useMemo(
    () => characterView?.shardLocations.filter((l) => l.isMythic) ?? [],
    [characterView]
  )
  const { offers: shopOffers } = useUnitShopShardSupply(detail.entityId)
  // A goal predating the picker has no persisted `acquisitionSources`: that seeds as "untouched, use
  // the live default" (`null`), not as an explicit empty selection, or every campaign node renders
  // unchecked and the dialog reports a change the user never made.
  const persisted = detail.config.acquisitionSources ?? []
  const hasPersistedSources = persisted.length > 0
  const seed =
    usesAcquisitionSources && hasPersistedSources
      ? acquisitionSourceSeed(
          persisted,
          regularShardLocations,
          mythicShardLocations
        )
      : null
  const selection = useAcquisitionSourceSelection({
    entityType: detail.entityType,
    entityId: detail.entityId,
    charactersById,
    unlockShardCostsById,
    lockedShards: undefined,
    battlesById,
    dailyEnergy,
    shopOffers,
    seed,
  })

  const onslaught = useEditOnslaughtYield({
    detail,
    alliance: characterView?.alliance,
    enabled: isAscension && detail.entityType === "Character",
  })

  const baselineSources: AcquisitionSource[] | null = usesAcquisitionSources
    ? hasPersistedSources
      ? persisted
      : acquisitionSourcesFromPlan(selection.defaultPlan, { isUnlock })
    : null
  const sources: AcquisitionSource[] | null = usesAcquisitionSources
    ? acquisitionSourcesFromPlan(selection.plan, { isUnlock })
    : null

  return {
    isAscension,
    usesAcquisitionSources,
    selection,
    shopOffers,
    baselineSources,
    sources,
    onslaught,
  }
}

/** The Onslaught group's yield note for the Edit goal dialog — the same per-run yield the create
 *  form shows (see `onslaughtShardsPerRun`), from the player's saved Onslaught position and the
 *  character's *current* progression, falling back to the goal's saved start when the unit isn't
 *  in the synced roster. */
function useEditOnslaughtYield({
  detail,
  alliance,
  enabled,
}: {
  detail: GoalDetail
  alliance: string | undefined
  enabled: boolean
}) {
  const isAuthenticated = useIsAuthenticated()
  const { data: onslaughtProgress } = useQuery({
    ...onslaughtProgressQueries.current(),
    enabled: isAuthenticated && enabled,
  })
  const rewards = useLiveQuery(
    () => (enabled ? getOnslaughtRewards() : undefined),
    [enabled]
  )
  const playerCharacter = useLiveQuery(
    () =>
      enabled && isAuthenticated
        ? getPlayerCharacter(detail.entityId as UnitId)
        : undefined,
    [enabled, isAuthenticated, detail.entityId]
  )

  const currentProgression = (playerCharacter?.progressionIndex ??
    detail.config.progression?.start) as Progression | undefined
  const shardsPerRun =
    enabled && onslaughtProgress && rewards?.length && currentProgression
      ? onslaughtShardsPerRun({
          progress: onslaughtProgress,
          rewards,
          alliance: alliance ?? "Imperial",
          currentProgression,
        }).shardsPerRun
      : 0

  return {
    progressSaved: !!onslaughtProgress,
    shardsPerDay: shardsPerRun * ONSLAUGHT_RUNS_PER_DAY,
    currentIsMythic: currentProgression
      ? isMythicProgression(currentProgression)
      : false,
  }
}
