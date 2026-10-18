import { useCallback, useEffect, useRef } from "react"

import type { LegendaryEventLaneId } from "@/entities/legendary-event"

import type { LegendaryEventTab } from "./legendary-event-page.view-model"
import { progressHeadingId } from "./progress/progress-heading"

/**
 * The page's tab selection and the Overview's jumps into a lane: the lane summary's progress grid,
 * or a token section's Teams section or team card, scrolled into view once that lane's tab mounts.
 */
export function useLaneJump(
  selectedTab: LegendaryEventTab,
  setSelectedTab: (tab: LegendaryEventTab) => void
) {
  // The lane section the Overview asked to show; consumed by the effect below once that lane's
  // tab has mounted. A ref, not state: it drives a DOM scroll, never a render.
  const jumpTarget = useRef<{
    lane: LegendaryEventLaneId
    find: () => Element | null
  } | null>(null)
  const selectTab = useCallback(
    (tab: LegendaryEventTab) => {
      setSelectedTab(tab)
    },
    [setSelectedTab]
  )
  const jumpToLane = useCallback(
    (lane: LegendaryEventLaneId) => {
      // The heading carries the sticky-strip offset as scroll-margin (see progress-parts.tsx).
      jumpTarget.current = {
        lane,
        find: () => document.getElementById(progressHeadingId(lane)),
      }
      setSelectedTab(lane)
    },
    [setSelectedTab]
  )
  const openTeams = useCallback(
    (lane: LegendaryEventLaneId, teamId?: string) => {
      jumpTarget.current = {
        lane,
        find: () =>
          (teamId
            ? document.querySelector(
                `[data-testid="legendary-event-team-card"][data-team="${CSS.escape(teamId)}"]`
              )
            : null) ??
          document.querySelector('[data-testid="legendary-event-teams"]'),
      }
      setSelectedTab(lane)
    },
    [setSelectedTab]
  )
  useEffect(() => {
    const target = jumpTarget.current
    if (!target || target.lane !== selectedTab) return
    jumpTarget.current = null
    target.find()?.scrollIntoView({ block: "start" })
  }, [selectedTab])
  return { selectTab, jumpToLane, openTeams }
}
