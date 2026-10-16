import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import type { TourPageSteps } from "@/shared/tour"

const TIER_LIST_TOUR_TARGETS = {
  row: '[data-testid="tier-list-row-S"]',
  tile: '[data-testid="tier-list-first-tile"]',
  // The desktop controls row, or the mobile Filters button: both carry this test id.
  filters: '[data-testid="tier-list-filters"]',
} as const

/** The Tier List's page tour: the S row, its first tile, then the filters. Desktop and mobile
 *  share targets and order; only the placement differs. A step whose target is not rendered (the
 *  list is loading, absent, or the filters emptied it) is left out. */
export function useTierListTutorial({
  hasRow,
  hasTile,
  hasFilters,
}: {
  hasRow: boolean
  hasTile: boolean
  hasFilters: boolean
}): TourPageSteps {
  const { t } = useTranslation("legendaryEvents")
  return useMemo(() => {
    const step = (
      key: keyof typeof TIER_LIST_TOUR_TARGETS,
      placement: Step["placement"]
    ): Step => ({
      target: TIER_LIST_TOUR_TARGETS[key],
      placement,
      title: t(`tour.tierList.steps.${key}.title`),
      content: t(`tour.tierList.steps.${key}.content`),
    })
    const build = (placement: Step["placement"]) => [
      ...(hasRow ? [step("row", "bottom")] : []),
      ...(hasTile ? [step("tile", placement)] : []),
      ...(hasFilters ? [step("filters", "bottom")] : []),
    ]
    return { desktop: build("right"), mobile: build("bottom") }
  }, [hasRow, hasTile, hasFilters, t])
}
