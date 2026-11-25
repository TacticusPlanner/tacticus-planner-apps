import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"

import {
  legendaryEventPlanQueries,
  useLegendaryEvents,
} from "@/entities/legendary-event"
import type { PersonalRosterSnapshotList } from "@/entities/roster-snapshot"
import { useQueryReadState } from "@/shared/lib"
import type { ReadState } from "@/shared/lib"

import { manageRunRecordRows, nextAutoSnapshot } from "./manage-snapshots"
import type { ManageRunRecordRow, NextAutoSnapshot } from "./manage-snapshots"

/**
 * The manage sheet's Legendary Event rosters (every event, planned or not) and when the next
 * automatic snapshot can be taken. Reads nothing until `enabled` (the sheet is open).
 */
export function useManageRunRecords(
  enabled: boolean,
  list: PersonalRosterSnapshotList | undefined
): ReadState<{ rows: ManageRunRecordRow[]; nextAuto: NextAutoSnapshot }> {
  const records = useQueryReadState(
    useQuery({
      ...legendaryEventPlanQueries.latestRunRecordsAcrossEvents(),
      enabled,
    })
  )
  const events = useLegendaryEvents()
  const eventNames = useMemo(
    () =>
      new Map(
        (events.status === "ready" ? events.data : []).map((event) => [
          event.id,
          event.name,
        ])
      ),
    [events]
  )
  if (records.status !== "ready" || !list) {
    return records.status === "error"
      ? records
      : { status: "loading", retry: records.retry }
  }
  return {
    status: "ready",
    data: {
      rows: manageRunRecordRows(records.data.records, eventNames),
      nextAuto: nextAutoSnapshot(
        list.items,
        records.data.records,
        events.nowMs
      ),
    },
    retry: records.retry,
  }
}
