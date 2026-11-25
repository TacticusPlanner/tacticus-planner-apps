import { useTranslation } from "react-i18next"
import { Skeleton } from "@workspace/ui/components/skeleton"

/** A targeted project card's deadline fit count (project-deadline-fit), computed by the page from
 *  the one global-plan run: a skeleton while it loads, then "2 of 4 fit" (with "· 1 not estimated" when any are), or "All N done" once every
 *  goal is done and none is left unestimated. */
export type ProjectCardFitCount =
  | { status: "loading" }
  | {
      status: "ready"
      summary: {
        fit: number
        total: number
        notEstimated: number
        allDone: boolean
      }
    }

export function ProjectFitCount({ count }: { count: ProjectCardFitCount }) {
  const { t } = useTranslation()
  if (count.status === "loading") {
    return (
      <Skeleton className="h-4 w-16" data-testid="project-fit-count-loading" />
    )
  }
  const { summary } = count
  return (
    <span
      className="text-xs text-muted-foreground"
      data-testid="project-fit-count"
    >
      {summary.allDone && summary.notEstimated === 0
        ? t("goals.deadlineFit.header.allDone", { count: summary.total })
        : t("goals.deadlineFit.header.count", summary)}
      {/* The Goals header's "N not estimated", so "0 of 0 fit" never hides an unestimated goal. */}
      {summary.notEstimated > 0
        ? `${t("goals.deadlineFit.header.separator")}${t(
            "goals.deadlineFit.header.notEstimated",
            { count: summary.notEstimated }
          )}`
        : null}
    </span>
  )
}
