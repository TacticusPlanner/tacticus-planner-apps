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
} from "./event-board.view-model"

const LEADERBOARD_LANES_KEY = "legendaryEvents.leaderboard.lanes"
const ALL_LANES = serializeVisibleLanes(LEGENDARY_EVENT_LANE_IDS)

/** The Eligibility leaderboard's own lane selection (every lane by default), apart from the page's
 *  lane switches and remembered per browser. The last lane cannot be turned off. */
export function useLeaderboardLanes(): {
  laneIds: readonly LegendaryEventLaneId[]
  onToggle: (laneId: LegendaryEventLaneId, shown: boolean) => void
} {
  const [raw, setRaw] = usePersistedSelection(
    LEADERBOARD_LANES_KEY,
    isVisibleLanesValue,
    ALL_LANES
  )
  const laneIds = useMemo(() => parseVisibleLanes(raw), [raw])
  const onToggle = useCallback(
    (laneId: LegendaryEventLaneId, shown: boolean) => {
      const next = LEGENDARY_EVENT_LANE_IDS.filter((id) =>
        id === laneId ? shown : laneIds.includes(id)
      )
      if (next.length > 0) setRaw(serializeVisibleLanes(next))
    },
    [laneIds, setRaw]
  )
  return { laneIds, onToggle }
}
