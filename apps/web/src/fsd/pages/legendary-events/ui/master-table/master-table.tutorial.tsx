import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import type { TourPageSteps } from "@/shared/tour"

const MASTER_TABLE_TOUR_TARGETS = {
  controls: '[data-testid="master-table-controls"]',
  events: '[data-testid="master-table-events"]',
  pointsMode: '[data-testid="master-table-points-mode"]',
  // Mobile: the Units and Points controls sit behind the toolbar's View button.
  view: '[data-testid="master-table-view"]',
  firstRow: '[data-testid="master-table-first-row"]',
} as const
/**
 * The master table tour (design D5): the toolbar, the event picker, the points mode and the first
 * row. On mobile the points-mode step points at the View button, whose sheet holds the control.
 */
export function useMasterTableTutorial(): TourPageSteps {
  const { t } = useTranslation("legendaryEvents")
  return useMemo(() => {
    const step = (
      key: Exclude<keyof typeof MASTER_TABLE_TOUR_TARGETS, "view">,
      placement: Step["placement"],
      target: string = MASTER_TABLE_TOUR_TARGETS[key]
    ): Step => ({
      target,
      placement,
      title: t(`tour.masterTable.steps.${key}.title`),
      content: t(`tour.masterTable.steps.${key}.content`),
    })
    const desktop: Step[] = [
      step("controls", "bottom"),
      step("events", "bottom"),
      step("pointsMode", "bottom"),
      step("firstRow", "top"),
    ]
    const mobile: Step[] = [
      step("controls", "bottom"),
      step("events", "bottom"),
      step("pointsMode", "bottom", MASTER_TABLE_TOUR_TARGETS.view),
      step("firstRow", "bottom"),
    ]
    return { desktop, mobile }
  }, [t])
}
