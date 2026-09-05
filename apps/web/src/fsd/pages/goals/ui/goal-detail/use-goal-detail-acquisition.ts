import { useMemo } from "react"

import type { GoalDetail } from "@/entities/goal"
import { estimateGoal, useUnitShopShardSupply } from "@/features/goal-farming"

import { useGoalCatalog } from "../../model/shared/use-goal-catalog"
import { useAcquisitionSourceSelection } from "../../model/goal-creation-form/use-acquisition-source-selection"
import {
  acquisitionSourceSeed,
  acquisitionSourcesFromPlan,
} from "../../model/goal-creation-form/acquisition-plan"
import { normalizeAcquisitionSources } from "./goal-detail-draft"

type CharactersById = ReturnType<typeof useGoalCatalog>["charactersById"]
type UnlockShardCostsById = ReturnType<
  typeof useGoalCatalog
>["unlockShardCostsById"]
type BattlesById = Parameters<typeof estimateGoal>[0]["battlesById"]

/**
 * Unlock/Ascension's acquisition-source picker wiring (Campaigns/Onslaught/Shops,
 * tacticus-planner-apps#103) — a long-lived selection-hook instance, re-seeded imperatively from
 * the goal's saved config each time edit mode is (re-)entered (see `goal-detail-sheet.tsx`'s
 * `enterEdit`), rather than a lazily-initialized one that would only pick up the very first goal
 * ever opened in this sheet. Split out of `goal-detail-sheet.tsx` purely for that file's own
 * max-lines budget.
 */
export function useGoalDetailAcquisition({
  detail,
  mode,
  isUnlock,
  charactersById,
  unlockShardCostsById,
  battlesById,
  dailyEnergy,
}: {
  detail: GoalDetail | null
  mode: "view" | "edit"
  isUnlock: boolean
  charactersById: CharactersById
  unlockShardCostsById: UnlockShardCostsById
  battlesById: BattlesById
  dailyEnergy: number
}) {
  const isAscension = detail?.goalType === "Ascension"
  const usesAcquisitionSources = isUnlock || isAscension
  const characterView =
    detail?.entityType === "Character"
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
  const { offers: shopOffers } = useUnitShopShardSupply(detail?.entityId)
  // A goal predating this control (or not yet round-tripped through it) has no persisted
  // `acquisitionSources` — that must seed as "untouched, use the live default" (`null`), not as an
  // explicit empty selection, or every campaign node renders unchecked and Cancel always confirms a
  // discard the user never made (tacticus-planner-apps#103).
  const hasPersistedSources =
    (detail?.config.acquisitionSources?.length ?? 0) > 0
  const acquisitionSeed = useMemo(
    () =>
      usesAcquisitionSources && hasPersistedSources
        ? acquisitionSourceSeed(
            detail?.config.acquisitionSources,
            regularShardLocations,
            mythicShardLocations
          )
        : null,
    [
      usesAcquisitionSources,
      hasPersistedSources,
      detail?.config,
      regularShardLocations,
      mythicShardLocations,
    ]
  )
  const acquisitionSelection = useAcquisitionSourceSelection({
    entityType: detail?.entityType ?? "Character",
    entityId: detail?.entityId,
    charactersById,
    unlockShardCostsById,
    lockedShards: undefined,
    battlesById,
    dailyEnergy,
    shopOffers,
    seed: acquisitionSeed,
  })
  // Baselined against the seeded/default plan rather than the raw saved array — a goal with no
  // persisted sources has no saved array to compare against, and its live default is not the empty
  // selection a bare `?? []` would imply.
  const baselineAcquisitionSources = hasPersistedSources
    ? (detail?.config.acquisitionSources ?? [])
    : acquisitionSourcesFromPlan(acquisitionSelection.defaultPlan, {
        isUnlock,
      })
  const hasAcquisitionSourcesChanged =
    mode === "edit" &&
    usesAcquisitionSources &&
    !!detail &&
    normalizeAcquisitionSources(baselineAcquisitionSources) !==
      normalizeAcquisitionSources(
        acquisitionSourcesFromPlan(acquisitionSelection.plan, { isUnlock })
      )

  return {
    isAscension,
    usesAcquisitionSources,
    acquisitionSeed,
    acquisitionSelection,
    hasAcquisitionSourcesChanged,
    shopOffers,
  }
}
