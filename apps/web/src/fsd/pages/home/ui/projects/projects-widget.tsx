import { lazy, Suspense, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { useHomeProjects } from "@/features/project-management"

import { homeCardLimit } from "../../model/home-card-limit"
import { ProjectsWidgetList } from "./projects-widget-list"

// The fit counts need the plan engine, which Home otherwise never loads, so they arrive in their
// own chunk; the rows render without counts until it does.
const ProjectsWidgetFitList = lazy(() =>
  import("./projects-widget-fit-list").then((m) => ({
    default: m.ProjectsWidgetFitList,
  }))
)

/** Home dashboard's Your Projects widget: Default project first. Shows Home's card count of projects
 * (`homeCardLimit`, as Daily raids and Upcoming events do), then "Show N more" expands the list in
 * place (home-projects-widget spec). The header links to the Projects dashboard. */
export function ProjectsWidget() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const limit = homeCardLimit(useIsMobile())
  const [expanded, setExpanded] = useState(false)
  // Every project, so "Show N more" opens the rest in place without another read.
  const result = useHomeProjects(null)

  const body = (() => {
    if (result.status === "loading") {
      return (
        <div
          className="flex flex-col gap-2"
          data-testid="home-projects-loading"
        >
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      )
    }
    if (result.status === "error") {
      return (
        <div className="flex flex-col gap-2" data-testid="home-projects-error">
          <p className="text-sm text-destructive">{t("home.projects.error")}</p>
          <Button onClick={result.retry} size="sm" variant="outline">
            {t("home.projects.retry")}
          </Button>
        </div>
      )
    }
    if (result.status === "empty") {
      return (
        <div className="flex flex-col gap-2" data-testid="home-projects-empty">
          <p className="text-sm font-medium">{t("home.projects.emptyTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("home.projects.emptyDescription")}
          </p>
          <Button
            className="self-start"
            onClick={() => void navigate("/plan/projects")}
            size="sm"
          >
            {t("home.projects.emptyAction")}
          </Button>
        </div>
      )
    }

    const hiddenCount = Math.max(0, result.projects.length - limit)
    const listProps = {
      projects: expanded ? result.projects : result.projects.slice(0, limit),
      summaries: result.summaries,
      onSelect: (projectId: string) =>
        void navigate(`/plan/goals?project=${projectId}`),
    }
    return (
      <div className="flex flex-col gap-3">
        <Suspense fallback={<ProjectsWidgetList {...listProps} />}>
          <ProjectsWidgetFitList {...listProps} />
        </Suspense>
        {hiddenCount > 0 ? (
          <Button
            aria-expanded={expanded}
            className="self-start"
            data-testid="home-projects-more"
            onClick={() => setExpanded((value) => !value)}
            size="sm"
            variant="ghost"
          >
            {expanded
              ? t("home.projects.showLess")
              : t("home.projects.showMore", { count: hiddenCount })}
          </Button>
        ) : null}
      </div>
    )
  })()

  return (
    <Card data-testid="home-projects-widget" id="home-projects">
      <CardHeader>
        <CardTitle>{t("home.projects.title")}</CardTitle>
        <CardAction>
          <Button asChild size="sm" variant="ghost">
            <Link data-testid="home-projects-all" to="/plan/projects">
              {t("home.projects.viewAll")}
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
