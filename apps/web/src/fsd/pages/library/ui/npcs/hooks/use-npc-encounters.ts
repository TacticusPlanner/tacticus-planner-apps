import { useMemo } from "react"
import type { EventsCalendarStorageModel } from "@workspace/game-catalog"

import {
  indexEncounterPlaces,
  indexEncounters,
  type EncounterPlaceIndex,
  type NpcEncounterIndex,
} from "@/entities/npc"
import { useCatalogDataset } from "@/shared/local-data"

import { useDatasetSynced } from "../../unit/use-catalog-dataset"

/**
 * The `npc-encounters` data as the NPC Library reads it. `absent` covers a dataset that has never synced —
 * an API that does not serve it yet looks the same — so the page shows the "unavailable" note and hides the
 * game-mode filter rather than claiming no NPC is ever encountered.
 */
type NpcEncountersData =
  | { status: "loading" }
  | { status: "absent" }
  | { status: "failed" }
  | {
      status: "present"
      index: NpcEncounterIndex
      places: EncounterPlaceIndex
    }

export type NpcEncountersReadState = {
  encounters: NpcEncountersData
  /** The stored calendar rows, or `null` while the calendar is loading, absent or failed. */
  calendar: readonly EventsCalendarStorageModel[] | null
}

export function useNpcEncounters(): NpcEncountersReadState {
  const index = useCatalogDataset("npc-encounters", indexEncounters)
  const synced = useDatasetSynced("npc-encounters")
  const calendar = useCatalogDataset("events-calendar")
  const calendarSynced = useDatasetSynced("events-calendar")

  const presentIndex =
    index.status === "ready" && synced.status === "ready" && synced.data
      ? index.data
      : undefined
  const encounters = useMemo<NpcEncountersData>(() => {
    if (index.status === "error" || synced.status === "error") {
      return { status: "failed" }
    }
    if (index.status === "loading" || synced.status === "loading") {
      return { status: "loading" }
    }
    if (!presentIndex) return { status: "absent" }
    return {
      status: "present",
      index: presentIndex,
      places: indexEncounterPlaces(presentIndex),
    }
  }, [index.status, synced.status, presentIndex])

  return {
    encounters,
    // An unsynced calendar reads as an empty table; that is "unknown", not "nothing scheduled".
    calendar:
      calendar.status === "ready" &&
      calendarSynced.status === "ready" &&
      calendarSynced.data
        ? calendar.data
        : null,
  }
}
