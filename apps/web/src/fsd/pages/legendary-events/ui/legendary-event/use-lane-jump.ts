import { useCallback, useEffect, useRef } from "react"
import { useSearchParams } from "react-router"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"

import {
  LEGENDARY_EVENT_TABS,
  type LeaderboardScope,
  type LegendaryEventTab,
} from "./legendary-event-page.view-model"
import { progressHeadingId } from "./progress/progress-heading"

/** The lane (Lanes, Progress, Battles) and Leaderboard scope to show with a tab; left out, each
 *  keeps its current value. */
export interface TabOptions {
  lane?: LegendaryEventLaneId
  scope?: LeaderboardScope
}

const DEFAULT_TAB: LegendaryEventTab = "overview"
const DEFAULT_LANE: LegendaryEventLaneId = "alpha"

const isTab = (value: string | null): value is LegendaryEventTab =>
  (LEGENDARY_EVENT_TABS as readonly (string | null)[]).includes(value)
const isLane = (value: string | null): value is LegendaryEventLaneId =>
  (LEGENDARY_EVENT_LANE_IDS as readonly (string | null)[]).includes(value)

/**
 * The page's tab and lane selection, held in the `tab` and `lane` query parameters (replace
 * history; a default value is left out), and the jumps between tabs: the lane summary's jump to a
 * lane's progress grid, and a token section's jump to a lane's Teams section or team card, each
 * scrolled into view once that tab has mounted. A link from before the Lanes tab (`?tab=beta`)
 * opens Lanes on that lane; any other unknown value falls back to the default. The Leaderboard
 * tab keeps its own scope (`scope`: every lane, or one), since it starts on the cross-lane board.
 */
export function useLaneJump() {
  const [params, setParams] = useSearchParams()
  const rawTab = params.get("tab")
  const rawLane = params.get("lane")
  const legacyLane = isLane(rawTab) ? rawTab : undefined
  const selectedTab: LegendaryEventTab = legacyLane
    ? "lanes"
    : isTab(rawTab)
      ? rawTab
      : DEFAULT_TAB
  const selectedLane: LegendaryEventLaneId =
    legacyLane ?? (isLane(rawLane) ? rawLane : DEFAULT_LANE)
  // The Leaderboard tab's scope: every lane (the default, left out of the URL) or one lane.
  const rawScope = params.get("scope")
  const leaderboardScope: LeaderboardScope = isLane(rawScope) ? rawScope : "all"

  // Every parameter changes in one update, so a tab-and-lane jump never loses either half.
  const show = useCallback(
    (tab: LegendaryEventTab, options: TabOptions = {}) =>
      setParams(
        (previous) => {
          if (tab === DEFAULT_TAB) previous.delete("tab")
          else previous.set("tab", tab)
          const { lane, scope } = options
          if (lane !== undefined) {
            if (lane === DEFAULT_LANE) previous.delete("lane")
            else previous.set("lane", lane)
          }
          if (scope !== undefined) {
            if (scope === "all") previous.delete("scope")
            else previous.set("scope", scope)
          }
          return previous
        },
        { replace: true }
      ),
    [setParams]
  )

  // Rewrites a legacy or invalid value to the canonical parameters.
  const canonical =
    (rawTab === null || (isTab(rawTab) && rawTab !== DEFAULT_TAB)) &&
    (rawLane === null || (isLane(rawLane) && rawLane !== DEFAULT_LANE)) &&
    (rawScope === null || isLane(rawScope))
  useEffect(() => {
    if (canonical) return
    setParams(
      (previous) => {
        if (selectedTab === DEFAULT_TAB) previous.delete("tab")
        else previous.set("tab", selectedTab)
        if (selectedLane === DEFAULT_LANE) previous.delete("lane")
        else previous.set("lane", selectedLane)
        if (leaderboardScope === "all") previous.delete("scope")
        return previous
      },
      { replace: true }
    )
  }, [canonical, selectedTab, selectedLane, leaderboardScope, setParams])

  // The section a jump asked to show; consumed by the effect below once its tab and lane have
  // mounted. A ref, not state: it drives a DOM scroll, never a render.
  const jumpTarget = useRef<{
    tab: LegendaryEventTab
    lane: LegendaryEventLaneId
    find: () => Element | null
  } | null>(null)

  const selectTab = useCallback(
    (tab: LegendaryEventTab, options?: TabOptions) => show(tab, options),
    [show]
  )
  const selectLane = useCallback(
    (lane: LegendaryEventLaneId) => show(selectedTab, { lane }),
    [show, selectedTab]
  )
  const selectLeaderboardScope = useCallback(
    (scope: LeaderboardScope) => show(selectedTab, { scope }),
    [show, selectedTab]
  )
  const openLane = useCallback(
    (lane: LegendaryEventLaneId) => show("lanes", { lane }),
    [show]
  )
  const jumpToLane = useCallback(
    (lane: LegendaryEventLaneId) => {
      // The heading carries the sticky-strip offset as scroll-margin (see progress-parts.tsx).
      jumpTarget.current = {
        tab: "progress",
        lane,
        find: () => document.getElementById(progressHeadingId(lane)),
      }
      show("progress", { lane })
    },
    [show]
  )
  const openTeams = useCallback(
    (lane: LegendaryEventLaneId, teamId?: string) => {
      jumpTarget.current = {
        tab: "lanes",
        lane,
        find: () =>
          (teamId
            ? document.querySelector(
                `[data-testid="legendary-event-team-card"][data-team="${CSS.escape(teamId)}"]`
              )
            : null) ??
          document.querySelector('[data-testid="legendary-event-teams"]'),
      }
      show("lanes", { lane })
    },
    [show]
  )
  useEffect(() => {
    const target = jumpTarget.current
    if (!target || target.tab !== selectedTab || target.lane !== selectedLane)
      return
    jumpTarget.current = null
    target.find()?.scrollIntoView({ block: "start" })
  }, [selectedTab, selectedLane])
  return {
    selectedTab,
    selectedLane,
    selectTab,
    selectLane,
    leaderboardScope,
    selectLeaderboardScope,
    openLane,
    jumpToLane,
    openTeams,
  }
}
