import { useTranslation } from "react-i18next"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { fitCountText } from "../model/project-status-text"
import type { FitCountSummary } from "../model/project-status-text"

/** A targeted project card's deadline fit count (project-deadline-fit), computed by the page from
 *  the one global-plan run: a skeleton while it loads, then "2 of 4 fit" (with "· 1 not estimated" when any are), or "All N done" once every
 *  goal is done and none is left unestimated. */
export type ProjectCardFitCount =
  | { status: "loading" }
  | {
      status: "ready"
      summary: FitCountSummary
    }

export function ProjectFitCount({ count }: { count: ProjectCardFitCount }) {
  const { t } = useTranslation()
  if (count.status === "loading") {
    return (
      <Skeleton className="h-4 w-16" data-testid="project-fit-count-loading" />
    )
  }
  return (
    <span
      className="text-xs text-muted-foreground"
      data-testid="project-fit-count"
    >
      {fitCountText(t, count.summary)}
    </span>
  )
}
