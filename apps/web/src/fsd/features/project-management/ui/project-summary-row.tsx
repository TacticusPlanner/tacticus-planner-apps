import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Pressable } from "@workspace/ui/components/pressable"

import { ProjectColorDot } from "@/entities/project"
import type { ProjectSummary } from "@/entities/project"
import { useDateLocale } from "@/shared/lib"
import { TruncatedText } from "@/shared/ui"

import type { ProjectCardSummary } from "./project-row"
import type { ProjectCardFitCount } from "./project-fit-count"
import { homeProjectFactsText } from "../model/project-status-text"
import { ProjectDeadlineChip } from "./project-deadline-chip"
import { ProjectUnitPortraits } from "./project-unit-portraits"

/** A condensed, identity-only project row for the home dashboard's Your Projects widget, two lines
 * tall whatever it holds, so it matches Daily raids' and Upcoming events' rows: color, name,
 * Default badge and the deadline's timing, then the unit portraits beside one line of facts (fit
 * count, "Done by", goal count) — no lifecycle actions (home-projects-widget spec: "Cards in this
 * widget SHALL NOT render lifecycle actions"). The whole row navigates. */
export function ProjectSummaryRow({
  onSelect,
  project,
  summary,
  fitCount,
}: {
  onSelect: () => void
  project: ProjectSummary
  summary: ProjectCardSummary | undefined
  /** The deadline fit count slot (project-deadline-fit), filled by the home page; absent for an
   *  untargeted or ended project. */
  fitCount?: ProjectCardFitCount
}) {
  const { t } = useTranslation()

  return (
    <li>
      <Pressable
        className="flex w-full min-w-0 cursor-pointer flex-col rounded-xl border p-3 text-left"
        data-testid={`home-project-row-${project.projectId}`}
        onClick={onSelect}
      >
        <span className="flex h-6 w-full min-w-0 items-center gap-2">
          <ProjectColorDot color={project.color} />
          <TruncatedText className="min-w-0 font-medium">
            {project.name}
          </TruncatedText>
          {project.isDefault ? (
            <Badge className="shrink-0" variant="secondary">
              {t("goals.project.defaultBadge")}
            </Badge>
          ) : null}
          {project.target ? (
            // Without its link: the whole row is already a button.
            <span className="ml-auto flex shrink-0">
              <ProjectDeadlineChip
                link={false}
                project={project}
                short
                testId="home-project-target"
              />
            </span>
          ) : null}
        </span>
        <span className="flex h-6 w-full min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <SummaryFacts
            fitCount={project.target ? fitCount : undefined}
            projectId={project.projectId}
            summary={summary}
          />
        </span>
      </Pressable>
    </li>
  )
}

/** The row's second line: portraits, then the facts on one line that truncates. */
function SummaryFacts({
  projectId,
  summary,
  fitCount,
}: {
  projectId: string
  summary: ProjectCardSummary | undefined
  fitCount: ProjectCardFitCount | undefined
}) {
  const { t } = useTranslation()
  const dateLocale = useDateLocale()

  if (summary?.status === "error") {
    return (
      <span className="truncate text-destructive">
        {t("home.projects.summaryUnavailable")}
      </span>
    )
  }
  if (summary?.status !== "success") {
    return <Skeleton className="h-4 w-28" />
  }

  const { progress } = summary
  const completion = progress?.status === "ready" ? progress.completion : null
  const fit = fitCount?.status === "ready" ? fitCount.summary : null
  const facts = homeProjectFactsText(t, {
    goals: summary.goals,
    fit,
    completion,
    dateLocale,
  })
  const loading =
    progress?.status === "loading" || fitCount?.status === "loading"

  return (
    <>
      {summary.portraitUnits ? (
        <ProjectUnitPortraits
          total={summary.units}
          units={summary.portraitUnits}
        />
      ) : null}
      <TruncatedText
        className="min-w-0"
        data-testid={`project-status-${projectId}`}
      >
        {facts}
      </TruncatedText>
      {loading ? (
        <Skeleton
          className="h-4 w-16 shrink-0"
          data-testid="project-status-loading"
        />
      ) : null}
    </>
  )
}
