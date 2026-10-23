import { useCallback, useMemo, useRef, useState } from "react"

import {
  useLegendaryEventRunRecordRosters,
  useLegendaryEventRunRecords,
  useTeamDisplayName,
  type LegendaryEventState,
  type LegendaryEventProgress,
  type LegendaryEventRosterUnit,
} from "@/entities/legendary-event"
import type { RunHistory } from "../../../lib/run-history"
import { useAnalyticsActions } from "@/shared/analytics"

import type {
  LastRunSectionViewModel,
  ReadValue,
} from "../legendary-event-page.view-model"
import {
  buildLastRunClears,
  buildLastRunViewModel,
  historyDeltaCount,
  previousRunRecord,
  type LastRunClears,
} from "./last-run.view-model"

/**
 * Run history on the event page (design D6–D9): reads the event's run records and derives the
 * Last run card's state, each previous-run team's cleared battle for the team cards, and the
 * card's analytics (`legendary_event_last_run_viewed` once per page view, Earlier runs opened).
 */
export function useLastRun(
  eventId: string,
  eventState: LegendaryEventState,
  /** `enabled`: signed in, so the records are read. */
  { enabled }: { enabled: boolean },
  {
    progress,
    roster,
  }: {
    progress: ReadValue<LegendaryEventProgress | undefined>
    roster: ReadValue<LegendaryEventRosterUnit[] | undefined>
  }
): {
  lastRun: LastRunSectionViewModel
  lastRunClears: LastRunClears
  /** The card renders with a previous run (the tour's Last run step). */
  hasLastRun: boolean
} {
  const event = eventState.status === "ready" ? eventState.data : undefined
  const lifecycle = eventState.lifecycle?.state
  const { records, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useLegendaryEventRunRecords(eventId)
  // Rosters at the time are read for the previous run up front and for each earlier run while open.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())
  const previous = lifecycle
    ? previousRunRecord({ enabled, records, lifecycle, progress })
    : undefined
  const wanted =
    records.status === "ready"
      ? records.data.filter(
          (record) => record === previous || expanded.has(record.id)
        )
      : []
  const rosters = useLegendaryEventRunRecordRosters(eventId, wanted)
  const { captureEvent } = useAnalyticsActions()
  const teamName = useTeamDisplayName()
  const state = useMemo(
    () =>
      event && lifecycle
        ? buildLastRunViewModel({
            enabled,
            records,
            lifecycle,
            progress,
            roster,
            rosters,
            event,
            teamName,
          })
        : ({ kind: "loading" } as const),
    [event, lifecycle, enabled, records, progress, roster, rosters, teamName]
  )
  const lastRunClears = useMemo(
    () =>
      lifecycle
        ? buildLastRunClears({ enabled, records, lifecycle, progress })
        : undefined,
    [lifecycle, enabled, records, progress]
  )
  const viewed = useRef(false)
  const onViewed = useCallback(
    (history: RunHistory) => {
      if (viewed.current) return
      viewed.current = true
      captureEvent({
        type: "legendary_event_last_run_viewed",
        eventId,
        run: history.run,
        teamCount: history.teamCount,
        deltaCount: historyDeltaCount(history),
      })
    },
    [captureEvent, eventId]
  )
  const onEarlierExpanded = useCallback(
    (recordCount: number) =>
      captureEvent({
        type: "legendary_event_earlier_runs_expanded",
        eventId,
        recordCount,
      }),
    [captureEvent, eventId]
  )
  const onEarlierEntryToggled = useCallback(
    (recordId: string, open: boolean) =>
      setExpanded((current) => {
        const next = new Set(current)
        if (open) next.add(recordId)
        else next.delete(recordId)
        return next
      }),
    []
  )
  return {
    lastRun: {
      state,
      onViewed,
      onEarlierExpanded,
      onEarlierEntryToggled,
      loadMore: hasNextPage
        ? { onLoadMore: fetchNextPage, loading: isFetchingNextPage }
        : undefined,
    },
    lastRunClears,
    hasLastRun: state.kind === "ready",
  }
}
