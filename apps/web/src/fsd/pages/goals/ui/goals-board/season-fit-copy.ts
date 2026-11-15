import type { TFunction } from "i18next"

import { formatEstimateDate } from "@/shared/lib"
import { deadlineFitTone } from "@/features/goal-planning"
import type {
  ActiveSeasonFit,
  DeadlineGoalFit,
  GoalSeasonFit,
  SeasonFitOffset,
  SeasonFitSeason,
} from "@/features/goal-planning"

/** A project deadline's fits as the list shows them (project-deadline-fit), in place of Season fit
 *  in a targeted scope. `chip` is the target's chip text ("LE · Uthar"). */
export type DeadlineFitView = {
  kind: "deadline"
  chip: string
  deadlineMs: number
  fits: ReadonlyMap<string, DeadlineGoalFit>
}

/** What the list measures goals against: a Season fit, or the scoped project's deadline. Both share
 *  the labels' slot, the accents and the divider. */
export type GoalFitView = ActiveSeasonFit | DeadlineFitView

export function isDeadlineFitView(
  view: GoalFitView | null | undefined
): view is DeadlineFitView {
  return !!view && "kind" in view
}

const DEADLINE_TONE_OFFSET = {
  onTrack: 0,
  caution: 1,
  urgent: 2,
} as const satisfies Record<ReturnType<typeof deadlineFitTone>, SeasonFitOffset>

/** A goal's accent as a Season fit offset: the season offset, or for a deadline fit 0 (fits), 1 (a
 *  miss of 1 to 7 days) or 2 (more), so both use the same tokens. Undefined for no fit. */
export function goalFitOffset(
  view: GoalFitView | null | undefined,
  goalId: string
): SeasonFitOffset | undefined {
  if (!view) return undefined
  if (isDeadlineFitView(view)) {
    const fit = view.fits.get(goalId)
    return fit ? DEADLINE_TONE_OFFSET[deadlineFitTone(fit)] : undefined
  }
  return view.fits.get(goalId)?.offset
}

const FIT_LABEL_KEY = {
  0: "thisSeason",
  1: "nextSeason",
  2: "inTwoSeasons",
  3: "later",
} as const satisfies Record<SeasonFitOffset, string>

/** Desktop row accent: an inset bar on the first cell (a `<tr>` border depends on the table's
 *  border model; the first cell's shadow does not). Written out in full for Tailwind's scanner. */
export const SEASON_FIT_ROW_ACCENT: Record<SeasonFitOffset, string | null> = {
  0: "[&>td:first-child]:shadow-[inset_3px_0_0_var(--season-fit-on-track)]",
  1: "[&>td:first-child]:shadow-[inset_3px_0_0_var(--season-fit-caution)]",
  2: "[&>td:first-child]:shadow-[inset_3px_0_0_var(--season-fit-urgent)]",
  3: null,
}

/** Mobile card accent: a thicker left border in the offset's colour. */
export const SEASON_FIT_CARD_ACCENT: Record<SeasonFitOffset, string | null> = {
  0: "border-l-4 border-l-(--season-fit-on-track)",
  1: "border-l-4 border-l-(--season-fit-caution)",
  2: "border-l-4 border-l-(--season-fit-urgent)",
  3: null,
}

/** Guild War measures against the next season's start (goal-season-fit spec), the others against
 *  the current season's end. */
function deadlineVerb(season: SeasonFitSeason): "Ends" | "Starts" {
  return season === "guildWar" ? "Starts" : "Ends"
}

/** A UTC instant as the same short date the Done By cell shows. */
export function formatDeadline(ms: number, locale: string): string {
  return (
    formatEstimateDate(new Date(ms).toISOString().slice(0, 10), locale) ?? ""
  )
}

/** The season named in copy: the deadline's season, i.e. the next one for Guild War. */
function seasonName(t: TFunction, active: ActiveSeasonFit): string {
  const number =
    active.seasonNumber === undefined
      ? undefined
      : active.seasonNumber + (active.season === "guildWar" ? 1 : 0)
  return number === undefined
    ? t(`goals.seasonFit.season.${active.season}`)
    : t(`goals.seasonFit.season.${active.season}Numbered`, { number })
}

function seasonFitLabel(t: TFunction, fit: GoalSeasonFit): string {
  return t(`goals.seasonFit.fit.${FIT_LABEL_KEY[fit.offset]}`)
}

function seasonFitTooltip(
  t: TFunction,
  locale: string,
  active: ActiveSeasonFit,
  fit: GoalSeasonFit
): string {
  const relation = fit.offset === 0 ? "" : "After"
  return t(`goals.seasonFit.tooltip${relation}${deadlineVerb(active.season)}`, {
    date: formatEstimateDate(fit.date, locale) ?? fit.date,
    season: seasonName(t, active),
    deadline: formatDeadline(active.deadlineMs, locale),
  })
}

function deadlineFitLabel(t: TFunction, fit: DeadlineGoalFit): string {
  return fit.fits
    ? t("goals.deadlineFit.fits")
    : t("goals.deadlineFit.misses", { count: fit.daysLate })
}

function deadlineFitTooltip(
  t: TFunction,
  locale: string,
  view: DeadlineFitView,
  fit: DeadlineGoalFit
): string {
  return t(`goals.deadlineFit.tooltip${fit.fits ? "" : "After"}`, {
    date: formatEstimateDate(fit.date, locale) ?? fit.date,
    chip: view.chip,
    deadline: formatDeadline(view.deadlineMs, locale),
  })
}

export function seasonCutoffText(
  t: TFunction,
  locale: string,
  active: GoalFitView
): string {
  if (isDeadlineFitView(active)) {
    return t("goals.deadlineFit.divider", {
      chip: active.chip,
      deadline: formatDeadline(active.deadlineMs, locale),
    })
  }
  return t(`goals.seasonFit.divider${deadlineVerb(active.season)}`, {
    season: seasonName(t, active),
    deadline: formatDeadline(active.deadlineMs, locale),
  })
}

/** A goal's label and tooltip under the view in force, null for a goal without a fit. */
export function goalFitCopy(
  view: GoalFitView | null | undefined,
  goalId: string,
  t: TFunction,
  locale: string
): { label: string; tooltip: string } | null {
  if (!view) return null
  if (isDeadlineFitView(view)) {
    const fit = view.fits.get(goalId)
    return fit
      ? {
          label: deadlineFitLabel(t, fit),
          tooltip: deadlineFitTooltip(t, locale, view, fit),
        }
      : null
  }
  const fit = view.fits.get(goalId)
  return fit
    ? {
        label: seasonFitLabel(t, fit),
        tooltip: seasonFitTooltip(t, locale, view, fit),
      }
    : null
}
