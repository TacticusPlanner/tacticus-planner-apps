import type { EstimateOutcome } from "@/features/goal-farming/@x/goal-planning"

import type { GoalRow } from "../shared/types"
import type { SeasonFitSeason, SeasonWindows } from "./season-windows"

const DAY_MS = 86_400_000

/** The Season fit select's value: off, or the season type goals are measured against. */
export type SeasonFitMode = "off" | SeasonFitSeason

export const SEASON_FIT_MODES: readonly SeasonFitMode[] = [
  "off",
  "battlePass",
  "guildRaid",
  "guildWar",
]

/** Type guard for a value read back from browser storage. */
export function isSeasonFitMode(value: unknown): value is SeasonFitMode {
  return (SEASON_FIT_MODES as readonly unknown[]).includes(value)
}

/** 0 this season, 1 next season, 2 the one after, 3 later (goal-season-fit spec). */
export type SeasonFitOffset = 0 | 1 | 2 | 3

/** One eligible goal's fit: its offset and the Done By date it was computed from. */
export type GoalSeasonFit = { offset: SeasonFitOffset; date: string }

/** The instant a goal counts as done: the start of the day after its inclusive Done By date. Null for
 *  a value that is not a well-formed `yyyy-mm-dd` date. */
export function completionInstantMs(isoDate: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return null
  const ms = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(ms) ? null : ms + DAY_MS
}

/** How many season boundaries the goal's completion falls after; past the last known boundary of a
 *  short (authored-only) list counts as "later". Null for an unparseable date. */
export function seasonFitOffset(
  isoDate: string,
  windows: SeasonWindows
): SeasonFitOffset | null {
  const completionMs = completionInstantMs(isoDate)
  if (completionMs === null) return null
  const { boundariesMs } = windows
  const passed = boundariesMs.filter((ms) => ms < completionMs).length
  if (passed === boundariesMs.length) return 3
  return Math.min(passed, 3) as SeasonFitOffset
}

/** Active, not Reached, not a character Ability goal (excluded by rule, as V1's badge goals were),
 *  with a successful estimate. Machine of War Ability goals farm components with energy, so they
 *  have a real finish date and stay eligible, as V1's MoW goals did. */
export function isSeasonFitEligible(
  row: Pick<GoalRow, "status" | "goalType" | "entityType">,
  estimate: EstimateOutcome | undefined,
  reached: boolean
): estimate is EstimateOutcome & { date: string } {
  return (
    row.status === "Active" &&
    !(row.goalType === "Ability" && row.entityType !== "Mow") &&
    !reached &&
    !!estimate &&
    estimate.status !== "Blocked" &&
    !!estimate.date
  )
}

/** Each eligible row's fit, keyed by goal id; ineligible rows are absent. */
export function computeSeasonFits(
  rows: readonly Pick<
    GoalRow,
    "goalId" | "status" | "goalType" | "entityType"
  >[],
  estimates: ReadonlyMap<string, EstimateOutcome> | undefined,
  reachedByGoalId: ReadonlyMap<string, boolean> | undefined,
  windows: SeasonWindows
): Map<string, GoalSeasonFit> {
  const fits = new Map<string, GoalSeasonFit>()
  for (const row of rows) {
    const estimate = estimates?.get(row.goalId)
    if (
      !isSeasonFitEligible(
        row,
        estimate,
        reachedByGoalId?.get(row.goalId) ?? false
      )
    )
      continue
    const offset = seasonFitOffset(estimate.date, windows)
    if (offset !== null) fits.set(row.goalId, { offset, date: estimate.date })
  }
  return fits
}

/** The first goal, in display order, that finishes after the current season - the divider sits
 *  before it. Null when every fitted goal makes the season or none is fitted. */
export function seasonCutoffGoalId(
  orderedGoalIds: readonly string[],
  fits: ReadonlyMap<string, GoalSeasonFit>
): string | null {
  return (
    orderedGoalIds.find((goalId) => (fits.get(goalId)?.offset ?? 0) > 0) ?? null
  )
}
