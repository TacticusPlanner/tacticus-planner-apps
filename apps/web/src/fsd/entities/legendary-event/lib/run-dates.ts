import type { LegendaryEventRun } from "../model/plan.types"
import {
  LEGENDARY_EVENT_RUN_COUNT,
  LEGENDARY_EVENT_RUN_DURATION_MS,
  type LegendaryEventSchedule,
} from "./lifecycle"

const DAY_MS = 24 * 60 * 60 * 1000

/** One run's start: announced by the catalog, or estimated from the run gap. */
export interface LegendaryEventRunStart {
  run: LegendaryEventRun
  /** Null when neither announced nor estimable. */
  startMs: number | null
  estimated: boolean
}

export interface LegendaryEventRunDates {
  /** Runs 1–3, in order. */
  starts: LegendaryEventRunStart[]
  /** Run 3's start + 7 days; null when run 3 has no start. */
  deadlineMs: number | null
  deadlineEstimated: boolean
}

function announcedStarts(event: LegendaryEventSchedule): (number | null)[] {
  return Array.from({ length: LEGENDARY_EVENT_RUN_COUNT }, (_, index) => {
    const value = event.eventStageStartDatesUtc[index]
    const parsed = value === undefined ? Number.NaN : Date.parse(value)
    return Number.isNaN(parsed) ? null : parsed
  })
}

/**
 * The earliest the next run starts after the previous one, from the LRE history since Kharn: run 2
 * came 105–175 days after run 1 (140 or more in all but one event) and run 3 140–245 days after
 * run 2.
 */
const LEGENDARY_EVENT_MIN_RUN_GAP_DAYS = 140

/** The shortest run-1-to-run-3 cycle since Kharn (Aun'Shi, Shadowsun, Kharn, Mephiston); the most
 *  recent cycles took 350 days. */
const LEGENDARY_EVENT_MIN_CYCLE_DAYS = 315

/**
 * Each run's start and the deadline (spec: unannounced runs get an estimated start). An unannounced
 * run starts at the earliest the history allows: the previous run's start plus the minimum gap,
 * and run 3 no sooner than the minimum cycle after run 1. Planning to the earliest plausible
 * deadline keeps the goals in time if the runs come early.
 */
export function legendaryEventRunDates(
  event: LegendaryEventSchedule
): LegendaryEventRunDates {
  const announced = announcedStarts(event)
  const starts: LegendaryEventRunStart[] = []
  for (const [index, start] of announced.entries()) {
    const run = (index + 1) as LegendaryEventRun
    if (start !== null) {
      starts.push({ run, startMs: start, estimated: false })
      continue
    }
    const previous = starts[index - 1]?.startMs ?? null
    const first = starts[0]?.startMs ?? null
    let startMs =
      previous === null
        ? null
        : previous + LEGENDARY_EVENT_MIN_RUN_GAP_DAYS * DAY_MS
    if (startMs !== null && first !== null && run === 3) {
      startMs = Math.max(
        startMs,
        first + LEGENDARY_EVENT_MIN_CYCLE_DAYS * DAY_MS
      )
    }
    starts.push({ run, startMs, estimated: startMs !== null })
  }
  const last = starts[LEGENDARY_EVENT_RUN_COUNT - 1]!
  return {
    starts,
    deadlineMs:
      last.startMs === null
        ? null
        : last.startMs + LEGENDARY_EVENT_RUN_DURATION_MS,
    deadlineEstimated: last.estimated,
  }
}
