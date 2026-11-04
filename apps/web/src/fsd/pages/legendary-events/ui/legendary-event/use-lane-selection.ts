import { useCallback, useMemo } from "react"

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

/** The page's lane selection, shared by every lane block (the Event board, the leaderboard, the
 *  progress grid, Battles and Upgrade impact) and remembered per browser. */
export interface LaneSelection {
  /** The lanes the blocks render, in lane order: the selection on desktop, its first lane on
   *  mobile (one lane at a time). */
  shown: readonly LegendaryEventLaneId[]
  /** Desktop's switches: show or hide a lane; the last shown lane stays. */
  onToggle: (laneId: LegendaryEventLaneId, shown: boolean) => void
  /** Mobile's picker: show that lane alone. */
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
  const selected = useMemo(() => parseVisibleLanes(raw), [raw])
  const shown = useMemo(
    () => (isMobile ? selected.slice(0, 1) : selected),
    [isMobile, selected]
  )
  const onToggle = useCallback(
    (laneId: LegendaryEventLaneId, show: boolean) => {
      const next = show
        ? [...selected, laneId]
        : selected.filter((id) => id !== laneId)
      if (next.length > 0) setRaw(serializeVisibleLanes(next))
    },
    [selected, setRaw]
  )
  const onPick = useCallback(
    (laneId: LegendaryEventLaneId) => setRaw(serializeVisibleLanes([laneId])),
    [setRaw]
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
