import { useMemo, useState } from "react"

import {
  LEGENDARY_EVENT_LANE_IDS,
  type LegendaryEvent,
  type LegendaryEventBattle,
  type LegendaryEventLaneId,
  type ReadState,
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
 * Every lane's Battles section over the page's `lre-battles` read, the synced `npcs` and the
 * progress grid, with the page-held selection per lane and the mobile Map disclosure (design D3):
 * page state, so both survive tab switches and reset with the event (the page content is keyed by
 * the event id). The battle info dialog reads the same states. Empty until the event loads.
 */
export function useBattlesSection({
  event,
  battlesRead,
  progressGrid,
}: {
  event: LegendaryEvent | undefined
  battlesRead: ReadState<LegendaryEventBattle[]>
  progressGrid: ProgressGridViewModel
}): Partial<Record<LegendaryEventLaneId, BattlesViewModel>> {
  const npcsRead = useNpcsById()
  const npcs = readValue(npcsRead)
  const retryNpcs = npcsRead.retry
  const battles = readValue(battlesRead)
  const retryBattles = battlesRead.retry
  const [selectedByLane, setSelectedByLane] = useState<
    Partial<Record<LegendaryEventLaneId, number>>
  >({})
  const [mapOpen, setMapOpen] = useState(false)
  const states = useMemo(
    () =>
      event
        ? LEGENDARY_EVENT_LANE_IDS.map(
            (laneId) =>
              [
                laneId,
                buildBattlesSection({
                  battleIds: event[laneId].battleIds,
                  battles,
                  retryBattles,
                  npcs,
                  retryNpcs,
                  progress:
                    progressGrid.kind === "ready"
                      ? progressGrid.lanes[laneId]
                      : undefined,
                }),
              ] as const
          )
        : [],
    [event, battles, retryBattles, npcs, retryNpcs, progressGrid]
  )
  return useMemo(
    () =>
      Object.fromEntries(
        states.map(([laneId, state]) => [
          laneId,
          {
            state,
            selectedIndex: selectedByLane[laneId],
            onSelect: (index: number) =>
              setSelectedByLane((current) => ({ ...current, [laneId]: index })),
            mapOpen,
            onMapOpenChange: setMapOpen,
          } satisfies BattlesViewModel,
        ])
      ),
    [states, selectedByLane, mapOpen]
  )
}
