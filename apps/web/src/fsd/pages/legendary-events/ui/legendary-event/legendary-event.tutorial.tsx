import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { Step } from "react-joyride"

import type { TourPageSteps } from "@/shared/tour"

import type { LegendaryEventTab } from "./legendary-event-page.view-model"

const EVENT_TOUR_TARGETS = {
  tabs: '[data-testid="legendary-event-tabs"]',
  nextToken: '[data-testid="legendary-event-next-token"]',
  runStatus: '[data-testid="legendary-event-run-status"]',
  lastRun: '[data-testid="legendary-event-last-run"]',
  runInputs: '[data-testid="legendary-event-run-inputs"]',
  // The header, not the whole card: an expanded plan can be taller than the viewport.
  tokenPlan: '[data-testid="legendary-event-token-plan-header"]',
  laneSummary: '[data-testid="legendary-event-lane-summary"]',
  overviewLeaderboard: '[data-testid="legendary-event-overview-leaderboard"]',
  laneOverview: '[data-testid="legendary-event-lane-overview"]',
  teams: '[data-testid="legendary-event-teams"]',
  upgradeImpact: '[data-testid="legendary-event-upgrade-impact"]',
  progressGrid: '[data-testid="legendary-event-progress-grid"]',
  // The heading, not the whole section: a battle's waves can be taller than the viewport.
  battles: '[data-testid="legendary-event-battles"]',
  leaderboard: '[data-testid="legendary-event-leaderboard"]',
} as const

/**
 * Keeps every tooltip inside the viewport (spec: every step's tooltip lies fully inside the
 * viewport): when neither side of a tall target has room, Joyride's flip leaves the tooltip
 * overflowing, so the shift also runs on the cross axis (clamping the tooltip vertically, over the
 * target if need be) and a tooltip taller than a short viewport scrolls inside itself.
 */
const EVENT_TOUR_STEP_FIT = {
  floatingOptions: { shiftOptions: { crossAxis: true, padding: 16 } },
  styles: { tooltip: { maxHeight: "calc(100dvh - 32px)", overflowY: "auto" } },
} as const satisfies Pick<Step, "floatingOptions" | "styles">

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
 * The event page tour (spec: the Events pages have Joyride tours): the tab strip, the Next token
 * card (in whichever state it renders), Run status, the Last run card (only when it renders, so
 * the tour never shows an empty step), Run status's Inputs button (the same target on both
 * forms), the Token plan header, the Overview lane summary and cross-lane
 * leaderboard, then, after switching to Alpha through
 * `selectTab`, Alpha's lane overview, Teams section (with its Add team button), progress grid (and
 * its marks), Battles preview and leaderboard. Desktop and mobile share the steps.
 */
export function useLegendaryEventTutorial(
  selectTab: (tab: LegendaryEventTab) => void,
  /** The Last run card renders: its step follows Run status. */
  hasLastRun = false
): TourPageSteps {
  const { t } = useTranslation("legendaryEvents")
  return useMemo(() => {
    const step = (
      key: keyof typeof EVENT_TOUR_TARGETS,
      placement: Step["placement"]
    ): Step => ({
      ...EVENT_TOUR_STEP_FIT,
      target: EVENT_TOUR_TARGETS[key],
      placement,
      title: t(`tour.event.steps.${key}.title`),
      content: t(`tour.event.steps.${key}.content`),
    })
    const steps: Step[] = [
      step("tabs", "bottom"),
      step("nextToken", "bottom"),
      step("runStatus", "bottom"),
      ...(hasLastRun ? [step("lastRun", "top")] : []),
      step("runInputs", "bottom"),
      step("tokenPlan", "bottom"),
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
      step("upgradeImpact", "top"),
      step("progressGrid", "top"),
      step("battles", "top"),
      step("leaderboard", "top"),
    ]
    return { desktop: steps, mobile: steps }
  }, [hasLastRun, selectTab, t])
}
