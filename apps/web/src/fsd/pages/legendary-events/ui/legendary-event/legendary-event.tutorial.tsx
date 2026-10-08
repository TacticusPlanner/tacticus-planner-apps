import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import type { TourPageSteps } from "@/shared/tour"

import type { LegendaryEventTab } from "./legendary-event-page.view-model"

const EVENT_TOUR_TARGETS = {
  tabs: '[data-testid="legendary-event-tabs"]',
  runStatus: '[data-testid="legendary-event-run-status"]',
  laneSummary: '[data-testid="legendary-event-lane-summary"]',
  overviewLeaderboard: '[data-testid="legendary-event-overview-leaderboard"]',
  laneOverview: '[data-testid="legendary-event-lane-overview"]',
  teams: '[data-testid="legendary-event-teams"]',
  progressGrid: '[data-testid="legendary-event-progress-grid"]',
  leaderboard: '[data-testid="legendary-event-leaderboard"]',
} as const

/** Resolves once `selector` is in the document, or after `timeoutMs`. */
function waitForElement(selector: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs
    const check = () => {
      if (document.querySelector(selector) || Date.now() >= deadline) {
        resolve()
        return
      }
      setTimeout(check, 16)
    }
    check()
  })
}

/**
 * The event page tour (spec: the Events pages have Joyride tours): the tab strip, Run status, the
 * Overview lane summary and cross-lane leaderboard, then, after switching to Alpha through
 * `selectTab`, Alpha's lane overview, Teams section (with its Add team button), progress grid and
 * leaderboard. Desktop and mobile share the steps.
 */
export function useLegendaryEventTutorial(
  selectTab: (tab: LegendaryEventTab) => void
): TourPageSteps {
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
    const steps: Step[] = [
      step("tabs", "bottom"),
      step("runStatus", "bottom"),
      step("laneSummary", "top"),
      step("overviewLeaderboard", "top"),
      {
        ...step("laneOverview", "top"),
        before: async () => {
          selectTab("alpha")
          await waitForElement(EVENT_TOUR_TARGETS.laneOverview, 1000)
        },
      },
      step("teams", "top"),
      step("progressGrid", "top"),
      step("leaderboard", "top"),
    ]
    return { desktop: steps, mobile: steps }
  }, [selectTab, t])
}
