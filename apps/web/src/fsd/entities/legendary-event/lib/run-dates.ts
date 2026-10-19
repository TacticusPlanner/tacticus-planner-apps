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
 * The run gap (spec: unannounced runs get an estimated start): the median, rounded up to whole
 * days, of the days between consecutive announced run starts across every served event; null when
 * no event has two consecutive announced runs.
 */
export function legendaryEventRunGapDays(
  events: readonly LegendaryEventSchedule[]
): number | null {
  const gaps = events.flatMap((event) => {
    const starts = announcedStarts(event)
    return starts.slice(1).flatMap((start, index) => {
      const previous = starts[index]
      return start === null || previous === null || previous === undefined
        ? []
        : [(start - previous) / DAY_MS]
    })
  })
  if (gaps.length === 0) return null
  const sorted = gaps.toSorted((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 === 1
      ? sorted[middle]!
      : (sorted[middle - 1]! + sorted[middle]!) / 2
  return Math.ceil(median)
}

/** Each run's start, announced or the previous run's start plus the gap, and the deadline. */
export function legendaryEventRunDates(
  event: LegendaryEventSchedule,
  gapDays: number | null
): LegendaryEventRunDates {
  const announced = announcedStarts(event)
  const starts: LegendaryEventRunStart[] = []
  for (const [index, start] of announced.entries()) {
    const run = (index + 1) as LegendaryEventRun
    if (start !== null) {
      starts.push({ run, startMs: start, estimated: false })
      continue
    }
    const previous = starts[index - 1]
    const startMs =
      previous?.startMs != null && gapDays !== null
        ? previous.startMs + gapDays * DAY_MS
        : null
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
