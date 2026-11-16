import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { CalendarClock } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import type { ProjectDeadlineFit } from "@/features/goal-planning"
import { ProjectTargetChip } from "@/features/project-management"
import { useDateLocale } from "@/shared/lib"

import { formatDeadline } from "./season-fit-copy"

/**
 * The targeted scope's deadline header (project-deadline-fit): "Deadline: LE · Uthar starts Nov 27 ·
 * 2 of 4 fit · 1 not estimated", "All N done", "Ended <date>" or "No date available", with a one-line
 * skeleton while the deadline or estimates load. `action` (Move goals) sits at its end. On desktop it
 * is a line under the filters row; on mobile the first line above the cards.
 */
export function DeadlineFitHeader({
  fit,
  action,
}: {
  fit: Exclude<ProjectDeadlineFit, { status: "off" }>
  action?: ReactNode
}) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()

  const parts: string[] = []
  if (fit.status === "ready") {
    parts.push(
      t(
        fit.deadline.estimated
          ? "goals.deadlineFit.header.runsEstimated"
          : "goals.deadlineFit.header.runs",
        {
          date: formatDeadline(fit.deadline.deadlineMs, dateLocale),
          end: formatDeadline(fit.deadline.endMs, dateLocale),
        }
      )
    )
    const { summary } = fit
    if (summary.allDone) {
      parts.push(
        t("goals.deadlineFit.header.allDone", { count: summary.total })
      )
    } else if (summary.total > 0) {
      parts.push(t("goals.deadlineFit.header.count", summary))
      if (summary.duringEvent > 0) {
        parts.push(
          t("goals.deadlineFit.header.duringEvent", {
            count: summary.duringEvent,
          })
        )
      }
    }
    if (summary.notEstimated > 0) {
      parts.push(
        t("goals.deadlineFit.header.notEstimated", {
          count: summary.notEstimated,
        })
      )
    }
  } else if (fit.status === "ended") {
    // "<chip> · Ended <date>": the empty first part puts the separator after the chip.
    parts.push(
      "",
      t("goals.deadlineFit.header.ended", {
        date: formatDeadline(fit.deadline.deadlineMs, dateLocale),
      })
    )
  } else if (fit.status === "unavailable") {
    parts.push("", t("goals.deadlineFit.header.unavailable"))
  }

  return (
    <div
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
      data-status={fit.status}
      data-testid="goals-deadline-fit"
    >
      <span className="font-medium">{t("goals.deadlineFit.header.label")}</span>
      <ProjectTargetChip target={fit.target} />
      {fit.status === "loading" ? (
        <Skeleton
          className="h-4 w-48"
          data-testid="goals-deadline-fit-loading"
        />
      ) : (
        <span className="text-muted-foreground">
          {parts.join(t("goals.deadlineFit.header.separator"))}
        </span>
      )}
      {action === undefined ? null : <span className="ml-auto">{action}</span>}
    </div>
  )
}

/** The read-only chip that takes the Season fit select's place in a targeted scope
 *  (goal-season-fit). Icon-only with an accessible name on mobile, like the other compressed
 *  controls. */
export function DeadlineOverrideChip() {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const label = t("goals.deadlineFit.overrideChip")
  return (
    <Badge
      aria-label={isMobile ? label : undefined}
      className="h-8 gap-1.5 px-2.5"
      data-testid="goals-season-fit-override"
      role={isMobile ? "img" : undefined}
      title={label}
      variant="outline"
    >
      <CalendarClock aria-hidden />
      {isMobile ? null : label}
    </Badge>
  )
}
