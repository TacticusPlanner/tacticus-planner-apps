import { useCallback } from "react"
import { useTranslation } from "react-i18next"

/** A tier label's display name, e.g. "Epic 2". */
export function useTierLabelName() {
  const { t } = useTranslation(["incursions", "progression"])
  return useCallback(
    (label: { rarity: string; number: number }) =>
      t("card.tierOption", {
        rarity: t(`progression:rarities.${label.rarity}` as never, {
          defaultValue: label.rarity,
        }),
        number: label.number,
      }),
    [t]
  )
}
