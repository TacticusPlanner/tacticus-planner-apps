import { useCallback, useMemo, useRef } from "react"

import {
  useLegendaryEventRunRecords,
  type LegendaryEventState,
  type LegendaryEventProgress,
  type LegendaryEventRosterUnit,
  type RunHistory,
} from "@/entities/legendary-event"
import { useAnalyticsActions } from "@/shared/analytics"

import type {
  LastRunSectionViewModel,
  ReadValue,
} from "../legendary-event-page.view-model"
import {
  buildLastRunClears,
  buildLastRunViewModel,
  historyDeltaCount,
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
  const records = useLegendaryEventRunRecords(eventId)
  const { captureEvent } = useAnalyticsActions()
  const state = useMemo(
    () =>
      event && lifecycle
        ? buildLastRunViewModel({
            enabled,
            records,
            lifecycle,
            progress,
            roster,
            event,
          })
        : ({ kind: "loading" } as const),
    [event, lifecycle, enabled, records, progress, roster]
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
  return {
    lastRun: { state, onViewed, onEarlierExpanded },
    lastRunClears,
    hasLastRun: state.kind === "ready",
  }
}
