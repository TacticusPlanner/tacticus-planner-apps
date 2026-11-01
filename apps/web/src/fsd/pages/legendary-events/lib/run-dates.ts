import {
  LEGENDARY_EVENT_RUN_COUNT,
  LEGENDARY_EVENT_RUN_DURATION_MS,
  type LegendaryEventRun,
  type LegendaryEventSchedule,
} from "@/entities/legendary-event"

const DAY_MS = 24 * 60 * 60 * 1000

/** One run's start: announced by the catalog, or estimated from the run gap. */
export interface LegendaryEventRunStart {
  run: LegendaryEventRun
  /** The earliest the run can start (planning keeps goals in time); null when neither announced
   *  nor estimable. */
  startMs: number | null
  /** The likeliest start, from the typical run gap (shown to users as a guess); the announced
   *  start when there is one, null when not estimable. */
  guessMs: number | null
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

/** The shortest run-1-to-run-3 cycle since Kharn (Kharn and Mephiston); the most recent cycles took
 *  350 days. */
const LEGENDARY_EVENT_MIN_CYCLE_DAYS = 315

/**
 * The usual gap between consecutive runs: the recent run-1-to-run-3 cycles took 350 days, and
 * Lysander's run 2 came 175 days after run 1 (Uthar's 210 days is the longest recent gap).
 */
const LEGENDARY_EVENT_TYPICAL_RUN_GAP_DAYS = 175

/**
 * The gap between consecutive legendary events (any character): one event every five weeks
 * (Lysander 30 Aug, Uthar 4 Oct and Bile 8 Nov 2026). Events never overlap and are announced in
 * order, so a run not yet announced comes at least this long after the latest announced run.
 */
const LEGENDARY_EVENT_CADENCE_DAYS = 35

/** The latest announced run start across the given events; null when none is announced. */
function latestAnnouncedStart(
  events: readonly LegendaryEventSchedule[]
): number | null {
  let latest: number | null = null
  for (const event of events) {
    for (const start of announcedStarts(event)) {
      if (start !== null && (latest === null || start > latest)) latest = start
    }
  }
  return latest
}

/**
 * Each run's start and the deadline (spec: unannounced runs get an estimated start). An unannounced
 * run starts at the earliest the history allows: the previous run's start plus the minimum gap,
 * run 3 no sooner than the minimum cycle after run 1, and never before the event cadence after the
 * latest announced run of `events` (the catalog, so another event's announced run counts). Planning
 * to the earliest plausible deadline keeps the goals in time if the runs come early.
 */
export function legendaryEventRunDates(
  event: LegendaryEventSchedule,
  events: readonly LegendaryEventSchedule[] = []
): LegendaryEventRunDates {
  const announced = announcedStarts(event)
  const latest = latestAnnouncedStart([event, ...events])
  const notBefore =
    latest === null ? null : latest + LEGENDARY_EVENT_CADENCE_DAYS * DAY_MS
  const starts: LegendaryEventRunStart[] = []
  for (const [index, start] of announced.entries()) {
    const run = (index + 1) as LegendaryEventRun
    if (start !== null) {
      starts.push({ run, startMs: start, guessMs: start, estimated: false })
      continue
    }
    const previousGuess = starts[index - 1]?.guessMs ?? null
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
    if (startMs !== null && notBefore !== null) {
      startMs = Math.max(startMs, notBefore)
    }
    const guessMs =
      previousGuess === null || startMs === null
        ? null
        : Math.max(
            startMs,
            previousGuess + LEGENDARY_EVENT_TYPICAL_RUN_GAP_DAYS * DAY_MS
          )
    starts.push({ run, startMs, guessMs, estimated: startMs !== null })
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

/** A run's likely window for display: the announced dates, or the guessed start + 7 days. */
export function legendaryEventRunWindow(
  start: LegendaryEventRunStart
): { startMs: number; endMs: number; guessed: boolean } | null {
  if (start.guessMs === null) return null
  return {
    startMs: start.guessMs,
    endMs: start.guessMs + LEGENDARY_EVENT_RUN_DURATION_MS,
    guessed: start.estimated,
  }
}
