import { useCallback, useEffect, useRef } from "react"
import { useLocation, useNavigate, useParams } from "react-router"

import type { LegendaryEventLaneId } from "@/entities/legendary-event"

import {
  LEGENDARY_EVENT_TABS,
  type LegendaryEventTab,
} from "./legendary-event-page.view-model"
import { progressHeadingId } from "./progress/progress-heading"
import type { LaneSelection } from "./use-lane-selection"

/** How long a jump waits for its section to render (a tab's reads can still be loading). */
const JUMP_TIMEOUT_MS = 8000

const isTab = (value: string | undefined): value is LegendaryEventTab =>
  (LEGENDARY_EVENT_TABS as readonly (string | undefined)[]).includes(value)

/**
 * The page's tab, held in the path's last segment (`/legendary-events/:eventId/teams`; replace
 * history; the bare event path shows the default tab), and the jumps between tabs, each scrolled
 * into view once its section has rendered: the lane summary's jump to a lane's progress grid, a
 * token section's jump to a lane's Teams section or team card, View full plan, and the Event
 * board's battle count to that lane's Battles on Plan. A jump also shows its lane. An unknown
 * segment shows the default tab, which is the run tab while the event is active, else Overview.
 * The query string (lane selection and the like) is kept across tab switches.
 */
export function useLaneJump(
  defaultTab: LegendaryEventTab,
  lanes: Pick<LaneSelection, "shown" | "reveal">,
  /** Picks Plan's Battles lane (a jump to a lane's battles). */
  pickBattlesLane: (lane: LegendaryEventLaneId) => void
) {
  const { eventId, tab: tabParam } = useParams()
  const { search } = useLocation()
  const navigate = useNavigate()
  const selectedTab: LegendaryEventTab = isTab(tabParam) ? tabParam : defaultTab
  const show = useCallback(
    (tab: LegendaryEventTab) => {
      void navigate(
        { pathname: `/legendary-events/${eventId ?? ""}/${tab}`, search },
        { replace: true }
      )
    },
    [eventId, navigate, search]
  )

  const { reveal } = lanes

  // The section a jump asked to show; consumed by the effect below once it has rendered. A ref,
  // not state: it drives a DOM scroll, never a render.
  const jumpTarget = useRef<{
    tab: LegendaryEventTab
    find: () => Element | null
    /** When it was asked for: a section that has not rendered by then is never scrolled to. */
    at: number
  } | null>(null)
  const jump = useCallback(
    (
      tab: LegendaryEventTab,
      find: () => Element | null,
      lane?: LegendaryEventLaneId
    ) => {
      jumpTarget.current = { tab, find, at: Date.now() }
      if (lane) reveal(lane)
      show(tab)
    },
    [reveal, show]
  )

  const selectTab = useCallback(
    (tab: LegendaryEventTab) => {
      // Picking a tab cancels a jump still waiting for its section.
      jumpTarget.current = null
      show(tab)
    },
    [show]
  )
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
  const viewBattles = useCallback(
    (lane: LegendaryEventLaneId) => {
      pickBattlesLane(lane)
      jump("plan", () =>
        document.querySelector(
          `[data-testid="legendary-event-battles-section"][data-lane="${lane}"]`
        )
      )
    },
    [jump, pickBattlesLane]
  )
  // Every render: a jump's section can appear with its tab, its lane or Plan's Battles lane.
  useEffect(() => {
    const target = jumpTarget.current
    if (!target || target.tab !== selectedTab) return
    // A section that never renders (no progress grid, say) must not scroll the page later.
    if (Date.now() - target.at > JUMP_TIMEOUT_MS) {
      jumpTarget.current = null
      return
    }
    const element = target.find()
    if (!element) return
    jumpTarget.current = null
    element.scrollIntoView({ block: "start" })
  })
  return {
    selectedTab,
    selectTab,
    jumpToLane,
    openTeams,
    viewPlan,
    viewBattles,
  }
}
