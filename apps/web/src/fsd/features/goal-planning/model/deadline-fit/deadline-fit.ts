import type { EstimateOutcome } from "@/entities/goal-farming"

import {
  completionInstantMs,
  isSeasonFitEligible,
} from "../season-fit/season-fit"
import type { GoalRow } from "../shared/types"

const DAY_MS = 86_400_000

/** One eligible goal against a Legendary Event run (project-deadline-fit): it fits (done before the
 *  run starts), finishes during the run, or misses it, by whole UTC days after the run ends. */
export type DeadlineGoalFit =
  | { fits: true; date: string }
  | { fits: false; duringEvent: true; date: string }
  | { fits: false; duringEvent: false; daysLate: number; date: string }

/** The window a goal is measured against: the run's start (the deadline) and its end. */
export type DeadlineWindow = { deadlineMs: number; endMs: number }

/** The header and card count (project-deadline-fit). `total` counts the eligible goals plus the
 *  Reached and Completed ones, which count as fitting; `duringEvent` the eligible goals that finish
 *  while the run is on; `notEstimated` the Active or Paused goals that are not eligible. `allDone`
 *  holds when every counted goal is Reached or Completed. */
export type DeadlineFitSummary = {
  fit: number
  duringEvent: number
  total: number
  notEstimated: number
  allDone: boolean
}

type FitRow = Pick<GoalRow, "goalId" | "status" | "goalType" | "entityType">

/**
 * A goal with Done By `isoDate` against a run: its completion instant is 00:00 UTC the day after Done
 * By (Season fit's rule). It fits when that is at or before the run's start, finishes during the run
 * when it is at or before the run's end, and otherwise misses by ceil((completion − end) / 1 day).
 * Null for an unparseable date.
 */
export function deadlineFit(
  isoDate: string,
  window: DeadlineWindow
): DeadlineGoalFit | null {
  const completionMs = completionInstantMs(isoDate)
  if (completionMs === null) return null
  if (completionMs <= window.deadlineMs) return { fits: true, date: isoDate }
  if (completionMs <= window.endMs) {
    return { fits: false, duringEvent: true, date: isoDate }
  }
  return {
    fits: false,
    duringEvent: false,
    daysLate: Math.ceil((completionMs - window.endMs) / DAY_MS),
    date: isoDate,
  }
}

/** Each eligible row's fit (Season fit's eligibility), keyed by goal id; other rows are absent. */
export function computeDeadlineFits(
  rows: readonly FitRow[],
  estimates: ReadonlyMap<string, EstimateOutcome>,
  reachedByGoalId: ReadonlyMap<string, boolean>,
  window: DeadlineWindow
): Map<string, DeadlineGoalFit> {
  const fits = new Map<string, DeadlineGoalFit>()
  for (const row of rows) {
    const estimate = estimates.get(row.goalId)
    const reached = reachedByGoalId.get(row.goalId) ?? false
    if (!isSeasonFitEligible(row, estimate, reached)) continue
    const fit = deadlineFit(estimate.date, window)
    if (fit) fits.set(row.goalId, fit)
  }
  return fits
}

/** The counts the header and cards show, from the same fits the labels use. */
export function deadlineFitSummary(
  rows: readonly FitRow[],
  fits: ReadonlyMap<string, DeadlineGoalFit>,
  reachedByGoalId: ReadonlyMap<string, boolean>
): DeadlineFitSummary {
  let fit = 0
  let duringEvent = 0
  let total = 0
  let done = 0
  let notEstimated = 0
  for (const row of rows) {
    const reached = reachedByGoalId.get(row.goalId) ?? false
    if (row.status === "Completed" || reached) {
      fit += 1
      total += 1
      done += 1
      continue
    }
    const goalFit = fits.get(row.goalId)
    if (goalFit) {
      total += 1
      if (goalFit.fits) fit += 1
      else if (goalFit.duringEvent) duringEvent += 1
      continue
    }
    if (row.status === "Active" || row.status === "Paused") notEstimated += 1
  }
  return {
    fit,
    duringEvent,
    total,
    notEstimated,
    allDone: total > 0 && done === total,
  }
}

/** The first goal, in display order, that does not fit before the run starts - the start divider
 *  sits before it. Null when every fitted goal makes it. */
export function deadlineCutoffGoalId(
  orderedGoalIds: readonly string[],
  fits: ReadonlyMap<string, DeadlineGoalFit>
): string | null {
  return (
    orderedGoalIds.find((goalId) => fits.get(goalId)?.fits === false) ?? null
  )
}

/** The first goal, in display order, that finishes after the run ends - the end divider sits before
 *  it. Null when none does. */
export function eventEndCutoffGoalId(
  orderedGoalIds: readonly string[],
  fits: ReadonlyMap<string, DeadlineGoalFit>
): string | null {
  return (
    orderedGoalIds.find((goalId) => {
      const fit = fits.get(goalId)
      return fit?.fits === false && !fit.duringEvent
    }) ?? null
  )
}

/** The accent a fit carries (Season fit's tokens): on track when it fits, caution when it finishes
 *  during the run, urgent when it finishes after the run ends. */
export function deadlineFitTone(
  fit: DeadlineGoalFit
): "onTrack" | "caution" | "urgent" {
  if (fit.fits) return "onTrack"
  return fit.duringEvent ? "caution" : "urgent"
}
