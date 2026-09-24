import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import { type TourPageSteps } from "@/shared/tour"

/**
 * Desktop steps target the filter panel, the tile list, the two selectors, and the stats; mobile
 * swaps the tile list for the combobox. The filter step targets the panel rather than the controls,
 * since those are collapsed until the visitor opens them.
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
        step("filters", "npcs-filter-panel", "bottom"),
        step("list", "npcs-list", "right"),
        step("variation", "npcs-variation-select", "bottom"),
        step("level", "npcs-level-select", "bottom"),
        step("stats", "npcs-stats", "top"),
      ],
      mobile: [
        step("picker", "npcs-combobox", "bottom"),
        step("variation", "npcs-variation-select", "bottom"),
        step("level", "npcs-level-select", "bottom"),
        step("stats", "npcs-stats", "top"),
      ],
    }
  }, [t])
}
