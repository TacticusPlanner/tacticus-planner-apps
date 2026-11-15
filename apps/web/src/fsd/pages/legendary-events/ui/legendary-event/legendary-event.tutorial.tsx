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
  eventBoard: '[data-testid="legendary-event-board"]',
  teams: '[data-testid="legendary-event-teams"]',
  // The cross-lane board with two or three lanes shown, the lane's own with one.
  eligibility:
    '[data-testid="legendary-event-overview-leaderboard"], [data-testid="legendary-event-leaderboard"]',
  upgradeImpact: '[data-testid="legendary-event-upgrade-impact"]',
  progressGrid: '[data-testid="legendary-event-progress-grid"]',
  // The heading, not the whole section: a battle's waves can be taller than the viewport.
  battles: '[data-testid="legendary-event-battles"]',
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
 * The event page tour (spec: the Events pages have Joyride tours), one tab at a time. Overview:
 * the tab strip and the lane summary. Teams: the Event board, the first shown lane's Teams section
 * (with its Add team button) and the eligibility leaderboard. Plan: the Token plan header, Upgrade
 * impact and the battle preview. The run tab: the Next token card (in whichever state it renders),
 * Run status, its Inputs button (the same target on both forms), the progress grid (and its
 * marks) and the Last run card (only when it renders, so the tour never shows an empty step).
 * Every step first opens its tab through `selectTab` (a no-op when it is already open), so
 * stepping back across tabs lands on the right one too. Desktop and mobile share the steps.
 */
export function useLegendaryEventTutorial(
  selectTab: (tab: LegendaryEventTab) => void,
  /** The Last run card renders: its step closes the run tab. */
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
    // Opens the step's tab, then waits for its target.
    const onTab = (
      tab: LegendaryEventTab,
      key: keyof typeof EVENT_TOUR_TARGETS,
      placement: Step["placement"]
    ): Step => ({
      ...step(key, placement),
      before: async () => {
        selectTab(tab)
        await waitForElement(EVENT_TOUR_TARGETS[key], 1000)
      },
    })
    const steps: Step[] = [
      onTab("overview", "tabs", "bottom"),
      onTab("overview", "laneSummary", "top"),
      onTab("teams", "eventBoard", "top"),
      onTab("teams", "teams", "top"),
      onTab("teams", "eligibility", "top"),
      onTab("plan", "tokenPlan", "bottom"),
      onTab("plan", "upgradeImpact", "top"),
      onTab("plan", "battles", "top"),
      onTab("run", "nextToken", "bottom"),
      onTab("run", "runStatus", "bottom"),
      onTab("run", "runInputs", "bottom"),
      onTab("run", "progressGrid", "top"),
      ...(hasLastRun ? [onTab("run", "lastRun", "top")] : []),
    ]
    return { desktop: steps, mobile: steps }
  }, [hasLastRun, selectTab, t])
}
