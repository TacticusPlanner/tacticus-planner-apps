import { useMemo } from "react"

import { computeCreationPreview } from ".//goal-preview"

type CreationPreviewParams = Parameters<typeof computeCreationPreview>[0]

/**
 * Memoized wrapper around `computeCreationPreview` (plan §9 context (a): resource-requirement
 * preview + isolated day-by-day estimate) — split out of use-create-goal-form.ts purely for that
 * file's own max-lines budget; the calc itself stays pure in ./goal-preview.ts.
 */
export function useCreationPreview(params: CreationPreviewParams) {
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
