import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import type { TourPageSteps } from "@/shared/tour"

/**
 * Both start on the page toolbar (search and Filters), then desktop targets the tile list and mobile
 * the combobox, then the two selectors and the stats (whose step also explains that power is an
 * estimate). Both end on where the variation is encountered.
 */
export function useNpcsTutorial(): TourPageSteps {
  const { t } = useTranslation("library")

  return useMemo<TourPageSteps>(() => {
    const step = (key: string, target: string, placement: Step["placement"]) =>
      ({
        target: `[data-testid="${target}"]`,
        title: t(`npcs.tour.steps.${key}.title`, { defaultValue: key }),
        content: t(`npcs.tour.steps.${key}.content`, { defaultValue: key }),
        placement,
      }) satisfies Step

    return {
      desktop: [
        step("filters", "npcs-toolbar", "bottom"),
        step("list", "npcs-list", "right"),
        step("variation", "npcs-variation-select", "bottom"),
        step("level", "npcs-level-select", "bottom"),
        step("stats", "npcs-stats", "top"),
        step("encounters", "npc-encounters", "top"),
      ],
      mobile: [
        step("filters", "npcs-toolbar", "bottom"),
        step("picker", "npcs-combobox", "bottom"),
        step("variation", "npcs-variation-select", "bottom"),
        step("level", "npcs-level-select", "bottom"),
        step("stats", "npcs-stats", "top"),
        step("encounters", "npc-encounters", "top"),
      ],
    }
  }, [t])
}
