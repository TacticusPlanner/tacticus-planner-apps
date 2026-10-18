import { useMemo, useState } from "react"

import type {
  LegendaryEvent,
  LegendaryEventBattle,
  LegendaryEventLaneId,
  ReadState,
} from "@/entities/legendary-event"
import { useNpcsById } from "@/entities/npc"

import {
  readValue,
  type ProgressGridViewModel,
} from "../legendary-event-page.view-model"
import {
  buildBattlesSection,
  type BattlesViewModel,
} from "./battles.view-model"

/**
 * The selected lane's Battles section over the page's `lre-battles` read, the synced `npcs` and
 * the progress grid, with the page-held selection per lane and the mobile Map disclosure (design
 * D3): page state, so both survive tab switches and reset with the event (the page content is
 * keyed by the event id). Null on Overview.
 */
export function useBattlesSection({
  event,
  laneId,
  battlesRead,
  progressGrid,
}: {
  event: LegendaryEvent | undefined
  laneId: LegendaryEventLaneId | undefined
  battlesRead: ReadState<LegendaryEventBattle[]>
  progressGrid: ProgressGridViewModel
}): BattlesViewModel | null {
  const npcsRead = useNpcsById()
  const npcs = readValue(npcsRead)
  const retryNpcs = npcsRead.retry
  const battles = readValue(battlesRead)
  const retryBattles = battlesRead.retry
  const [selectedByLane, setSelectedByLane] = useState<
    Partial<Record<LegendaryEventLaneId, number>>
  >({})
  const [mapOpen, setMapOpen] = useState(false)
  const state = useMemo(
    () =>
      event && laneId
        ? buildBattlesSection({
            battleIds: event[laneId].battleIds,
            battles,
            retryBattles,
            npcs,
            retryNpcs,
            progress:
              progressGrid.kind === "ready"
                ? progressGrid.lanes[laneId]
                : undefined,
          })
        : undefined,
    [event, laneId, battles, retryBattles, npcs, retryNpcs, progressGrid]
  )
  if (!state || !laneId) return null
  return {
    state,
    selectedIndex: selectedByLane[laneId],
    onSelect: (index) =>
      setSelectedByLane((current) => ({ ...current, [laneId]: index })),
    mapOpen,
    onMapOpenChange: setMapOpen,
  }
}
