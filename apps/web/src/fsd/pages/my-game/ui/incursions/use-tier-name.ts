import { useCallback, useMemo } from "react"

import { tierLabels, useTierLabelName } from "@/entities/incursion"

import type { Incursion } from "../../model/incursions.model"

/** A tier's display name by index, e.g. "Epic 2"; falls back to its 1-based position. */
export function useTierName(incursion: Incursion | undefined) {
  const labelName = useTierLabelName()
  const tiers = incursion?.tiers
  const labels = useMemo(() => tierLabels(tiers ?? []), [tiers])
  return useCallback(
    (index: number) => {
      const label = labels.get(index)
      return label ? labelName(label) : String(index + 1)
    },
    [labelName, labels]
  )
}
