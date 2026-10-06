import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import type { TourPageSteps } from "@/shared/tour"

const EVENT_TOUR_TARGETS = {
  runStatus: '[data-testid="legendary-event-run-status"]',
  laneSelector: '[data-testid="legendary-event-lane-selector"]',
  laneOverview: '[data-testid="legendary-event-lane-overview"]',
  leaderboard: '[data-testid="legendary-event-leaderboard"]',
  progressGrid: '[data-testid="legendary-event-progress-grid"]',
} as const

/** The event page tour: Run status, Lane overview, the Eligibility leaderboard and Synced progress;
 *  mobile first points at the lane selector that every lane-scoped section follows (design D4). */
export function useLegendaryEventTutorial(): TourPageSteps {
  const { t } = useTranslation("legendaryEvents")
  return useMemo(() => {
    const step = (
      key: keyof typeof EVENT_TOUR_TARGETS,
      placement: Step["placement"]
    ): Step => ({
      target: EVENT_TOUR_TARGETS[key],
      placement,
      title: t(`tour.event.steps.${key}.title`),
      content: t(`tour.event.steps.${key}.content`),
    })
    return {
      desktop: [
        step("runStatus", "bottom"),
        step("laneOverview", "top"),
        step("leaderboard", "top"),
        step("progressGrid", "top"),
      ],
      mobile: [
        step("laneSelector", "bottom"),
        step("runStatus", "bottom"),
        step("laneOverview", "top"),
        step("leaderboard", "top"),
        step("progressGrid", "top"),
      ],
    }
  }, [t])
}
