import { useMemo } from "react"

import type { AcquisitionSource, GoalDetail } from "@/entities/goal"
import { estimateGoal, useUnitShopShardSupply } from "@/features/goal-farming"

import {
  acquisitionSourceSeed,
  acquisitionSourcesFromPlan,
} from "../goal-creation-form/acquisition-plan"
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
  }
}
