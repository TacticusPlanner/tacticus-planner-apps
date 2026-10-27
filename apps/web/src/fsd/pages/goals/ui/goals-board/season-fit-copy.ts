import type { TFunction } from "i18next"

import { formatEstimateDate } from "@/shared/lib"
import type {
  ActiveSeasonFit,
  GoalSeasonFit,
  SeasonFitOffset,
  SeasonFitSeason,
} from "@/features/goal-planning"

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
function formatDeadline(ms: number, locale: string): string {
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

export function seasonFitLabel(t: TFunction, fit: GoalSeasonFit): string {
  return t(`goals.seasonFit.fit.${FIT_LABEL_KEY[fit.offset]}`)
}

export function seasonFitTooltip(
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

export function seasonCutoffText(
  t: TFunction,
  locale: string,
  active: ActiveSeasonFit
): string {
  return t(`goals.seasonFit.divider${deadlineVerb(active.season)}`, {
    season: seasonName(t, active),
    deadline: formatDeadline(active.deadlineMs, locale),
  })
}
