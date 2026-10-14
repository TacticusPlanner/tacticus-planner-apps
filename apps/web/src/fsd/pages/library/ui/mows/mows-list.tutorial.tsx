import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { type TourPageSteps } from "@/shared/tour"

/** The search field and the tile list; the same targets on desktop and mobile. */
export function useMowsListTutorial(): TourPageSteps {
  const { t } = useTranslation("library")

  return useMemo<TourPageSteps>(() => {
    const step = (key: string, target: string, placement: Step["placement"]) =>
      ({
        target: `[data-testid="${target}"]`,
        title: t(`mowsList.tour.steps.${key}.title`, { defaultValue: key }),
        content: t(`mowsList.tour.steps.${key}.content`, {
          defaultValue: key,
        }),
        placement,
      }) satisfies Step

    const steps = [
      step("search", "mows-search", "bottom"),
      step("list", "mows-list", "top"),
    ]
    return { desktop: steps, mobile: steps }
  }, [t])
}
