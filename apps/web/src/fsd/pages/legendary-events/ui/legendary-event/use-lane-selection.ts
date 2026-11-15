import { startTransition, useCallback, useMemo } from "react"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEventLaneId,
} from "@/entities/legendary-event"
import { usePersistedSelection } from "@/shared/lib"

import {
  isVisibleLanesValue,
  parseVisibleLanes,
  serializeVisibleLanes,
} from "./overview/event-board.view-model"

// The Event board's key from before the page shared one selection, so a choice made there stays.
const SHOWN_LANES_KEY = "legendaryEvents.eventBoard.lanes"
const ALL_LANES = serializeVisibleLanes(LEGENDARY_EVENT_LANE_IDS)
// Mobile's one lane, kept apart so picking it never narrows the desktop selection; empty until
// picked (the first desktop-selected lane shows).
const MOBILE_LANE_KEY = "legendaryEvents.lanes.mobile"
const isMobileLaneValue = (
  value: unknown
): value is "" | LegendaryEventLaneId =>
  value === "" ||
  (LEGENDARY_EVENT_LANE_IDS as readonly unknown[]).includes(value)

/** The page's lane selection, shared by the Teams and run tabs' lane blocks (the Event board, the
 *  leaderboard, the progress grid) and remembered per browser. */
export interface LaneSelection {
  /** The lanes the blocks render, in lane order: the selection on desktop; on mobile one lane at
   *  a time, the picked lane (remembered apart) or else the selection's first. */
  shown: readonly LegendaryEventLaneId[]
  /** Desktop's switches: show or hide a lane; the last shown lane stays. */
  onToggle: (laneId: LegendaryEventLaneId, shown: boolean) => void
  /** Mobile's picker: show that lane alone (the desktop selection is kept). */
  onPick: (laneId: LegendaryEventLaneId) => void
  /** Makes sure a lane renders (a jump to it): added on desktop, picked on mobile. */
  reveal: (laneId: LegendaryEventLaneId) => void
}

export function useLaneSelection(isMobile: boolean): LaneSelection {
  const [raw, setRaw] = usePersistedSelection(
    SHOWN_LANES_KEY,
    isVisibleLanesValue,
    ALL_LANES
  )
  const [mobileLane, setMobileLane] = usePersistedSelection(
    MOBILE_LANE_KEY,
    isMobileLaneValue,
    ""
  )
  const selected = useMemo(() => parseVisibleLanes(raw), [raw])
  const shown = useMemo(
    () =>
      isMobile
        ? mobileLane === ""
          ? selected.slice(0, 1)
          : [mobileLane]
        : selected,
    [isMobile, mobileLane, selected]
  )
  const onToggle = useCallback(
    (laneId: LegendaryEventLaneId, show: boolean) => {
      const next = show
        ? [...selected, laneId]
        : selected.filter((id) => id !== laneId)
      if (next.length === 0) return
      // A transition: the switch repaints at once (LaneSelector shows it optimistically) and the
      // lane blocks re-render after, so a tap never waits on them (web vitals plan item 6).
      startTransition(() => setRaw(serializeVisibleLanes(next)))
    },
    [selected, setRaw]
  )
  const onPick = useCallback(
    (laneId: LegendaryEventLaneId) =>
      startTransition(() => setMobileLane(laneId)),
    [setMobileLane]
  )
  const reveal = useCallback(
    (laneId: LegendaryEventLaneId) => {
      if (shown.includes(laneId)) return
      if (isMobile) onPick(laneId)
      else onToggle(laneId, true)
    },
    [shown, isMobile, onPick, onToggle]
  )
  return useMemo(
    () => ({ shown, onToggle, onPick, reveal }),
    [shown, onToggle, onPick, reveal]
  )
}
