import { useCallback, useMemo } from "react"

import { tierLabels, useTierLabelName } from "@/entities/incursion"
import { useCatalogDataset } from "@/shared/local-data"

/**
 * A tier's name and rarity by Machine of War and served tier index, as the Incursions page names it
 * ("Epic 2"). `undefined` while the `incursions` dataset does not name the tier.
 */
export function useIncursionTierNames() {
  const labelName = useTierLabelName()
  const incursions = useCatalogDataset("incursions")
  const records = incursions.status === "ready" ? incursions.data : undefined
  const labels = useMemo(
    () =>
      new Map(
        (records ?? []).map((incursion) => [
          incursion.mowId,
          tierLabels(incursion.tiers),
        ])
      ),
    [records]
  )

  return useCallback(
    (mowId: string, tier: number) => {
      const label = labels.get(mowId)?.get(tier)
      if (!label) return undefined
      return { rarity: label.rarity, name: labelName(label) }
    },
    [labelName, labels]
  )
}
