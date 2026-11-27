import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import type { TourPageSteps } from "@/shared/tour"

/** The Items list's Find controls and its first card; the same targets on desktop and mobile. */
export function useLibraryItemsTutorial(): TourPageSteps {
  const { t } = useTranslation("library")
  return useMemo<TourPageSteps>(() => {
    const steps: Step[] = [
      {
        target: '[data-testid="library-items-find"]',
        title: t("items.tour.find.title"),
        content: t("items.tour.find.content"),
        placement: "bottom",
      },
      {
        target: '[data-testid="library-item-card"]',
        title: t("items.tour.item.title"),
        content: t("items.tour.item.content"),
        placement: "bottom",
        data: { optional: true },
      },
    ]
    return { desktop: steps, mobile: steps }
  }, [t])
}
