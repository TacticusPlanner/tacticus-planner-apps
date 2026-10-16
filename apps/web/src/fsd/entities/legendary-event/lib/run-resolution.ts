import type { LegendaryEventRun } from "../model/plan.types"
import type {
  LegendaryEventLaneId,
  LegendaryEventLifecycle,
  LegendaryEventProgress,
} from "../model/types"
import {
  LEGENDARY_EVENT_RUN_COUNT as RUN_COUNT,
  LEGENDARY_EVENT_RUN_DURATION_MS,
  deriveLegendaryEventLifecycle,
  type LegendaryEventSchedule,
} from "./lifecycle"

const LANES: readonly LegendaryEventLaneId[] = ["alpha", "beta", "gamma"]

/**
 * Where an event's three runs stand (spec: legendary-event-run-resolution). `known`: `endedRuns`
 * runs are over, `currentRun` is in progress (active events only) and `nextRun` starts next
 * (`nextStartMs` null while its start is "to be announced"; both null once every run has ended).
 * `unknown`: the synced entry shows progress the schedule cannot place, so no run number is known.
 */
export type LegendaryEventRunResolution =
  | {
      kind: "known"
      endedRuns: 0 | 1 | 2 | 3
      currentRun: LegendaryEventRun | null
      nextRun: LegendaryEventRun | null
      nextStartMs: number | null
    }
  | {
      kind: "unknown"
      endedRuns: null
      currentRun: null
      nextRun: null
      nextStartMs: null
    }

export interface LegendaryEventRunResolutionInput {
  lifecycle: LegendaryEventLifecycle
  /** The catalog event's run starts (index = run − 1). */
  schedule: LegendaryEventSchedule
  /** The synced `currentEventRun`; the game sends it only while a run is active. */
  syncedRun: number | null | undefined
  /** Whether the account's synced entry shows progress (`legendaryEventHasProgress`). */
  hasProgress: boolean
  nowMs: number
}

const UNKNOWN: LegendaryEventRunResolution = {
  kind: "unknown",
  endedRuns: null,
  currentRun: null,
  nextRun: null,
  nextStartMs: null,
}

const asRun = (value: number): LegendaryEventRun =>
  Math.min(RUN_COUNT, Math.max(1, Math.trunc(value))) as LegendaryEventRun

/** Whether a synced entry shows the account has played the event: points above 0, or an encounter
 *  with points, a high score or a cleared objective. */
export function legendaryEventHasProgress(
  entry:
    | Pick<LegendaryEventProgress, "currentPoints" | LegendaryEventLaneId>
    | undefined
): boolean {
  if (!entry) return false
  if (entry.currentPoints > 0) return true
  return LANES.some((laneId) =>
    (entry[laneId]?.encounters ?? []).some(
      (encounter) =>
        encounter.encounterPoints > 0 ||
        encounter.highScore > 0 ||
        encounter.objectivesCleared.length > 0
    )
  )
}

/**
 * Resolves the ended, current and next run (design D1–D4). Run `n` starts at element `n − 1` of the
 * schedule and lasts 7 days. While the event is active a numeric synced run wins (else the schedule
 * window that holds the clock); otherwise the synced run is ignored, because the game sends none
 * between runs. The run is unknown when the synced entry shows progress but the schedule shows no
 * run ended or in progress.
 */
export function resolveLegendaryEventRuns({
  lifecycle,
  schedule,
  syncedRun,
  hasProgress,
  nowMs,
}: LegendaryEventRunResolutionInput): LegendaryEventRunResolution {
  const starts = schedule.eventStageStartDatesUtc
    .slice(0, RUN_COUNT)
    .map((value) => Date.parse(value))
  const startOf = (run: LegendaryEventRun): number | null => {
    const start = starts[run - 1]
    return start === undefined || Number.isNaN(start) ? null : start
  }
  const known = (
    endedRuns: number,
    currentRun: LegendaryEventRun | null
  ): LegendaryEventRunResolution => {
    const ended = Math.min(RUN_COUNT, Math.max(0, endedRuns)) as 0 | 1 | 2 | 3
    const nextRun =
      (currentRun ?? ended) < RUN_COUNT
        ? asRun((currentRun ?? ended) + 1)
        : null
    const nextStart = nextRun === null ? null : startOf(nextRun)
    return {
      kind: "known",
      endedRuns: ended,
      currentRun,
      nextRun,
      nextStartMs: nextStart !== null && nextStart > nowMs ? nextStart : null,
    }
  }

  if (lifecycle.state === "active") {
    if (typeof syncedRun === "number" && Number.isFinite(syncedRun)) {
      const current = asRun(syncedRun)
      return known(current - 1, current)
    }
    const index = starts.findIndex((start) => start === lifecycle.runStartMs)
    const current = asRun(index === -1 ? 1 : index + 1)
    return known(current - 1, current)
  }

  if (lifecycle.state === "archived") return known(RUN_COUNT, null)

  // Between runs (or before the first): the last run whose 7-day window has passed.
  let endedRuns = 0
  starts.forEach((start, index) => {
    if (
      !Number.isNaN(start) &&
      start + LEGENDARY_EVENT_RUN_DURATION_MS <= nowMs
    )
      endedRuns = index + 1
  })
  // A finished event has every run ended (and reads as archived), so it is never unknown.
  if (hasProgress && endedRuns === 0) return UNKNOWN
  return known(endedRuns, null)
}

/** `resolveLegendaryEventRuns` for a catalog event and its synced entry at `nowMs`, deriving the
 *  lifecycle from the same schedule (for callers without one at hand, e.g. the Master table). */
export function resolveLegendaryEventRunsAt(
  event: LegendaryEventRunResolutionInput["schedule"],
  progress:
    | Pick<
        LegendaryEventProgress,
        "currentEventRun" | "currentPoints" | LegendaryEventLaneId
      >
    | undefined,
  nowMs: number,
  lifecycle: LegendaryEventLifecycle = deriveLegendaryEventLifecycle(
    event,
    nowMs
  )
): LegendaryEventRunResolution {
  return resolveLegendaryEventRuns({
    lifecycle,
    schedule: event,
    syncedRun: progress?.currentEventRun,
    hasProgress: legendaryEventHasProgress(progress),
    nowMs,
  })
}
