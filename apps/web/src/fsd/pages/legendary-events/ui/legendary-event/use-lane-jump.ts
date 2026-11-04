import { useCallback, useEffect, useRef } from "react"
import { useSearchParams } from "react-router"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"

import {
  LEGENDARY_EVENT_TABS,
  type LegendaryEventTab,
} from "./legendary-event-page.view-model"
import { progressHeadingId } from "./progress/progress-heading"
import type { LaneSelection } from "./use-lane-selection"

const isTab = (value: string | null): value is LegendaryEventTab =>
  (LEGENDARY_EVENT_TABS as readonly (string | null)[]).includes(value)
const isLane = (value: string | null): value is LegendaryEventLaneId =>
  (LEGENDARY_EVENT_LANE_IDS as readonly (string | null)[]).includes(value)

/**
 * The page's tab, held in the `tab` query parameter (replace history; the default tab is left
 * out), and the jumps between tabs, each scrolled into view once its section has rendered: the
 * lane summary's jump to a lane's progress grid, a token section's jump to a lane's Teams section
 * or team card, and View full plan. A jump also shows its lane. A link from before the Teams tab
 * (`?tab=beta`) opens Teams with that lane shown; any other unknown value falls back to the
 * default. The default is the run tab while the event is active, else Overview.
 */
export function useLaneJump(
  defaultTab: LegendaryEventTab,
  lanes: Pick<LaneSelection, "shown" | "reveal">
) {
  const [params, setParams] = useSearchParams()
  const rawTab = params.get("tab")
  const legacyLane = isLane(rawTab) ? rawTab : undefined
  const selectedTab: LegendaryEventTab = legacyLane
    ? "teams"
    : isTab(rawTab)
      ? rawTab
      : defaultTab

  const show = useCallback(
    (tab: LegendaryEventTab) =>
      setParams(
        (previous) => {
          if (tab === defaultTab) previous.delete("tab")
          else previous.set("tab", tab)
          return previous
        },
        { replace: true }
      ),
    [setParams, defaultTab]
  )

  // Rewrites a legacy or invalid value to the canonical parameter.
  const { reveal } = lanes
  const canonical = rawTab === null || isTab(rawTab)
  useEffect(() => {
    if (canonical) return
    if (legacyLane) reveal(legacyLane)
    show(selectedTab)
  }, [canonical, legacyLane, reveal, selectedTab, show])

  // The section a jump asked to show; consumed by the effect below once it has rendered. A ref,
  // not state: it drives a DOM scroll, never a render.
  const jumpTarget = useRef<{
    tab: LegendaryEventTab
    find: () => Element | null
  } | null>(null)
  const jump = useCallback(
    (
      tab: LegendaryEventTab,
      find: () => Element | null,
      lane?: LegendaryEventLaneId
    ) => {
      jumpTarget.current = { tab, find }
      if (lane) reveal(lane)
      show(tab)
    },
    [reveal, show]
  )

  const selectTab = useCallback((tab: LegendaryEventTab) => show(tab), [show])
  const jumpToLane = useCallback(
    (lane: LegendaryEventLaneId) =>
      // The heading carries the sticky-strip offset as scroll-margin (see progress-parts.tsx).
      jump("run", () => document.getElementById(progressHeadingId(lane)), lane),
    [jump]
  )
  const openTeams = useCallback(
    (lane: LegendaryEventLaneId, teamId?: string) =>
      jump(
        "teams",
        () =>
          (teamId
            ? document.querySelector(
                `[data-testid="legendary-event-team-card"][data-team="${CSS.escape(teamId)}"]`
              )
            : null) ??
          document.querySelector(
            `[data-testid="legendary-event-teams"][data-lane="${lane}"]`
          ),
        lane
      ),
    [jump]
  )
  const viewPlan = useCallback(
    () =>
      jump("plan", () =>
        document.querySelector('[data-testid="legendary-event-token-plan"]')
      ),
    [jump]
  )
  const shownKey = lanes.shown.join(",")
  useEffect(() => {
    const target = jumpTarget.current
    if (!target || target.tab !== selectedTab) return
    const element = target.find()
    if (!element) return
    jumpTarget.current = null
    element.scrollIntoView({ block: "start" })
  }, [selectedTab, shownKey])
  return { selectedTab, selectTab, jumpToLane, openTeams, viewPlan }
}
