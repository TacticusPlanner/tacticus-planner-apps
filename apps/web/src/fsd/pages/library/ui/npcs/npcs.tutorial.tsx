import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import type { TourPageSteps } from "@/shared/tour"

/**
 * The list (`/library/npcs`) covers the toolbar (search and Filters) and the tiles; an NPC's page
 * covers the two selectors, the stats (whose step also explains that power is an estimate) and
 * where the variation is encountered. Desktop and mobile share the steps.
 */
export function useNpcsTutorial(onNpcPage: boolean): TourPageSteps {
  const { t } = useTranslation("library")

  return useMemo<TourPageSteps>(() => {
    const step = (key: string, target: string, placement: Step["placement"]) =>
      ({
        target: `[data-testid="${target}"]`,
        title: t(`npcs.tour.steps.${key}.title`, { defaultValue: key }),
        content: t(`npcs.tour.steps.${key}.content`, { defaultValue: key }),
        placement,
      }) satisfies Step

    const steps = onNpcPage
      ? [
          step("variation", "npcs-variation-select", "bottom"),
          step("level", "npcs-level-select", "bottom"),
          step("stats", "npcs-stats", "top"),
          step("encounters", "npc-encounters", "top"),
        ]
      : [
          step("filters", "npcs-toolbar", "bottom"),
          step("list", "npcs-list", "top"),
        ]
    return { desktop: steps, mobile: steps }
  }, [onNpcPage, t])
}
