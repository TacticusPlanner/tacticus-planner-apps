import { useTranslation } from "react-i18next"
import { Skeleton } from "@workspace/ui/components/skeleton"

/** A targeted project card's deadline fit count (project-deadline-fit), computed by the page from
 *  the one global-plan run: a skeleton while it loads, then "2 of 4 fit" or "All N done". */
export type ProjectCardFitCount =
  | { status: "loading" }
  | {
      status: "ready"
      summary: { fit: number; total: number; allDone: boolean }
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
      {summary.allDone
        ? t("goals.deadlineFit.header.allDone", { count: summary.total })
        : t("goals.deadlineFit.header.count", summary)}
    </span>
  )
}
