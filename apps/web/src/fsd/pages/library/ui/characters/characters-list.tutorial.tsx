import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { type TourPageSteps } from "@/shared/tour"

/** The search field and the tile list; the same targets on desktop and mobile. */
export function useCharactersListTutorial(): TourPageSteps {
  const { t } = useTranslation("library")

  return useMemo<TourPageSteps>(() => {
    const step = (key: string, target: string, placement: Step["placement"]) =>
      ({
        target: `[data-testid="${target}"]`,
        title: t(`charactersList.tour.steps.${key}.title`, {
          defaultValue: key,
        }),
        content: t(`charactersList.tour.steps.${key}.content`, {
          defaultValue: key,
        }),
        placement,
      }) satisfies Step

    const steps = [
      step("search", "characters-search", "bottom"),
      step("list", "characters-list", "top"),
    ]
    return { desktop: steps, mobile: steps }
  }, [t])
}
