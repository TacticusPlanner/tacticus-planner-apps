import type { TFunction } from "i18next"

import { formatEstimateDate } from "@/shared/lib"

/** A targeted project's deadline fit count (project-deadline-fit). */
export type FitCountSummary = {
  fit: number
  total: number
  notEstimated: number
  allDone: boolean
}

/** A project's completion outlook (plan-completion-outlook). */
export type CompletionSummary = {
  completionDate: string | null
  unestimatedGoalCount: number
}

const notEstimatedText = (t: TFunction, count: number): string | null =>
  count > 0 ? t("goals.deadlineFit.header.notEstimated", { count }) : null

const joinFacts = (t: TFunction, facts: (string | null)[]): string =>
  facts
    .filter((fact): fact is string => Boolean(fact))
    .join(t("goals.deadlineFit.header.separator"))

/** "2 of 4 fit" (with "· 1 not estimated" when any are, as the Goals header has it, so "0 of 0
 *  fit" never hides an unestimated goal), or "All N done" once every goal is done and estimated. */
export function fitCountText(t: TFunction, summary: FitCountSummary): string {
  const count =
    summary.allDone && summary.notEstimated === 0
      ? t("goals.deadlineFit.header.allDone", { count: summary.total })
      : t("goals.deadlineFit.header.count", summary)
  return joinFacts(t, [count, notEstimatedText(t, summary.notEstimated)])
}

/** "Done by Dec 26" (or "No date"), then "· N not estimated" unless `withUnestimated` is false
 *  (Home's row, where the fit count beside it already says so). */
export function completionText(
  t: TFunction,
  { completionDate, unestimatedGoalCount }: CompletionSummary,
  dateLocale: string,
  { withUnestimated = true }: { withUnestimated?: boolean } = {}
): string {
  return joinFacts(t, [
    completionDate
      ? t("goals.project.completionSummary", {
          date: formatEstimateDate(completionDate, dateLocale),
        })
      : t("goals.project.noDate"),
    withUnestimated ? notEstimatedText(t, unestimatedGoalCount) : null,
  ])
}

/** Home's one-line project facts, most useful first so a narrow row truncates the least useful:
 *  the fit count, "Done by", then the goal count (its units show as portraits beside it). */
export function homeProjectFactsText(
  t: TFunction,
  {
    goals,
    fit,
    completion,
    dateLocale,
  }: {
    goals: number
    fit: FitCountSummary | null
    completion: CompletionSummary | null
    dateLocale: string
  }
): string {
  return joinFacts(t, [
    fit ? fitCountText(t, fit) : null,
    completion && goals > 0
      ? completionText(t, completion, dateLocale, { withUnestimated: !fit })
      : null,
    t("goals.project.goalCount", { count: goals }),
  ])
}
