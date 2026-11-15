import { legendaryEventRunDates } from "@/entities/legendary-event/@x/project"
import type {
  LegendaryEventRun,
  LegendaryEventSchedule,
} from "@/entities/legendary-event/@x/project"

import type { ProjectTarget } from "../types"

/** A project target as the deadline reads it. `run` names one Legendary Event run; without it the
 *  target means the event's next run (the only form projects can hold today). */
export type ProjectDeadlineTarget = ProjectTarget & {
  run?: LegendaryEventRun | null
}

/** One catalog Legendary Event: its id and run start dates. */
export type ProjectDeadlineEvent = LegendaryEventSchedule & { id: string }

/** A project target's deadline (project-deadline). `deadlineMs` is a UTC instant; `estimated` marks
 *  an unannounced run's earliest estimated start; `ended` holds once the instant is at or before
 *  now (for a target without a run, once run 3 has started). */
export type ProjectDeadline =
  | { status: "loading" }
  | { status: "unavailable" }
  | {
      status: "ready"
      deadlineMs: number
      run: LegendaryEventRun
      estimated: boolean
      ended: boolean
    }

/**
 * Resolves a Legendary Event target to one instant: the named run's start, otherwise the start of
 * the first run that starts after `nowMs`. An unannounced run uses its earliest estimated start.
 * `events` is the catalog, or null while it loads. The event missing from the catalog, or a run
 * with no start, is unavailable.
 */
export function resolveProjectDeadline(
  target: ProjectDeadlineTarget,
  events: readonly ProjectDeadlineEvent[] | null,
  nowMs: number
): ProjectDeadline {
  if (events === null) return { status: "loading" }
  const event = events.find((candidate) => candidate.id === target.eventId)
  if (!event) return { status: "unavailable" }
  const { starts } = legendaryEventRunDates(event, events)

  if (target.run !== undefined && target.run !== null) {
    const start = starts[target.run - 1]
    if (!start || start.startMs === null) return { status: "unavailable" }
    return {
      status: "ready",
      deadlineMs: start.startMs,
      run: start.run,
      estimated: start.estimated,
      ended: start.startMs <= nowMs,
    }
  }

  for (const start of starts) {
    if (start.startMs === null) return { status: "unavailable" }
    if (start.startMs > nowMs) {
      return {
        status: "ready",
        deadlineMs: start.startMs,
        run: start.run,
        estimated: start.estimated,
        ended: false,
      }
    }
  }
  // Every run has started: the target ended with run 3's start.
  const last = starts.at(-1)
  if (!last || last.startMs === null) return { status: "unavailable" }
  return {
    status: "ready",
    deadlineMs: last.startMs,
    run: last.run,
    estimated: last.estimated,
    ended: true,
  }
}
