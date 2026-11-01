import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { tierLabels, type Incursion } from "../../model/incursions.model"

/** A tier's display name by index, e.g. "Epic 2"; falls back to its 1-based position. */
export function useTierName(incursion: Incursion) {
  const { t } = useTranslation(["incursions", "progression"])
  const labels = useMemo(() => tierLabels(incursion.tiers), [incursion.tiers])
  return useCallback(
    (index: number) => {
      const label = labels.get(index)
      return label
        ? t("card.tierOption", {
            rarity: t(`progression:rarities.${label.rarity}` as never, {
              defaultValue: label.rarity,
            }),
            number: label.number,
          })
        : String(index + 1)
    },
    [labels, t]
  )
}
