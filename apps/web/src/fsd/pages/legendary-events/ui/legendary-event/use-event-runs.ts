import { useMemo } from "react"

import {
  currentLegendaryEventRun,
  resolveLegendaryEventRunsAt,
  type LegendaryEvent,
  type LegendaryEventProgress,
  type LegendaryEventRosterUnit,
  type LegendaryEventRun,
  type LegendaryEventRunResolution,
} from "@/entities/legendary-event"

import {
  eventUnitRecord,
  type ReadValue,
} from "./legendary-event-page.view-model"

/** Before the event is known: nothing has started, the depth run is 1. */
const NO_EVENT_RUNS: LegendaryEventRunResolution = {
  kind: "known",
  endedRuns: 0,
  currentRun: null,
  nextRun: 1,
  nextStartMs: null,
}

/**
 * The event's runs, resolved from the catalog's run schedule, the clock and the synced run (spec:
 * legendary-event-run-resolution), and the run depths are read from and written to: the run in
 * progress, else the next run, else run 1 (unknown). The Teams section stays loading until the
 * progress resolves, so nothing captures the default meanwhile. Also the event unit's roster
 * record the reward goal starts from ("loading" / "error" passed through from the roster read).
 */
export function useEventRuns(
  event: { data?: LegendaryEvent; nowMs: number },
  syncedEntry: LegendaryEventProgress | undefined,
  roster: ReadValue<readonly LegendaryEventRosterUnit[] | undefined>
): {
  resolution: LegendaryEventRunResolution
  run: LegendaryEventRun
  eventUnit: ReadValue<LegendaryEventRosterUnit | undefined>
  /** The record when owned; undefined while the roster is pending, failed or lacks the unit. */
  ownedEventUnit: LegendaryEventRosterUnit | undefined
} {
  const { data: eventData, nowMs } = event
  const resolution = useMemo(
    () =>
      eventData
        ? resolveLegendaryEventRunsAt(eventData, syncedEntry, nowMs)
        : NO_EVENT_RUNS,
    [eventData, syncedEntry, nowMs]
  )
  const eventUnit =
    roster === "loading" || roster === "error"
      ? roster
      : eventUnitRecord(roster, eventData?.id ?? "")
  return {
    resolution,
    run: currentLegendaryEventRun(resolution),
    eventUnit,
    ownedEventUnit: typeof eventUnit === "object" ? eventUnit : undefined,
  }
}
