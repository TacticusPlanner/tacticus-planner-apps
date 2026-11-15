import type { EstimateOutcome } from "@/entities/goal-farming"

import {
  completionInstantMs,
  isSeasonFitEligible,
} from "../season-fit/season-fit"
import type { GoalRow } from "../shared/types"

const DAY_MS = 86_400_000

/** One eligible goal against a project deadline: it fits, or misses by whole UTC days. */
export type DeadlineGoalFit =
  { fits: true; date: string } | { fits: false; daysLate: number; date: string }

/** The header and card count (project-deadline-fit). `total` counts the eligible goals plus the
 *  Reached and Completed ones, which count as fitting; `notEstimated` the Active or Paused goals that
 *  are not eligible. `allDone` holds when every counted goal is Reached or Completed. */
export type DeadlineFitSummary = {
  fit: number
  total: number
  notEstimated: number
  allDone: boolean
}

type FitRow = Pick<GoalRow, "goalId" | "status" | "goalType" | "entityType">

/**
 * A goal with Done By `isoDate` against `deadlineMs`: its completion instant is 00:00 UTC the day after
 * Done By (Season fit's rule). It fits when that is at or before the deadline; otherwise it misses by
 * ceil((completion − deadline) / 1 day). Null for an unparseable date.
 */
export function deadlineFit(
  isoDate: string,
  deadlineMs: number
): DeadlineGoalFit | null {
  const completionMs = completionInstantMs(isoDate)
  if (completionMs === null) return null
  if (completionMs <= deadlineMs) return { fits: true, date: isoDate }
  return {
    fits: false,
    daysLate: Math.ceil((completionMs - deadlineMs) / DAY_MS),
    date: isoDate,
  }
}

/** Each eligible row's fit (Season fit's eligibility), keyed by goal id; other rows are absent. */
export function computeDeadlineFits(
  rows: readonly FitRow[],
  estimates: ReadonlyMap<string, EstimateOutcome>,
  reachedByGoalId: ReadonlyMap<string, boolean>,
  deadlineMs: number
): Map<string, DeadlineGoalFit> {
  const fits = new Map<string, DeadlineGoalFit>()
  for (const row of rows) {
    const estimate = estimates.get(row.goalId)
    const reached = reachedByGoalId.get(row.goalId) ?? false
    if (!isSeasonFitEligible(row, estimate, reached)) continue
    const fit = deadlineFit(estimate.date, deadlineMs)
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
      continue
    }
    if (row.status === "Active" || row.status === "Paused") notEstimated += 1
  }
  return { fit, total, notEstimated, allDone: total > 0 && done === total }
}

/** The first goal, in display order, that misses the deadline - the divider sits before it. Null
 *  when every fitted goal makes it. */
export function deadlineCutoffGoalId(
  orderedGoalIds: readonly string[],
  fits: ReadonlyMap<string, DeadlineGoalFit>
): string | null {
  return (
    orderedGoalIds.find((goalId) => fits.get(goalId)?.fits === false) ?? null
  )
}

/** The accent a fit carries: on track when it fits, caution for a miss of 1 to 7 days, urgent for
 *  more (Season fit's tokens). */
export function deadlineFitTone(
  fit: DeadlineGoalFit
): "onTrack" | "caution" | "urgent" {
  if (fit.fits) return "onTrack"
  return fit.daysLate <= 7 ? "caution" : "urgent"
}
