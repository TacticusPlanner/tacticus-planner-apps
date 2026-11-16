import { lazy, Suspense } from "react"
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

import { ProjectsWidgetList } from "./projects-widget-list"

// The fit counts need the plan engine, which Home otherwise never loads, so they arrive in their
// own chunk; the rows render without counts until it does.
const ProjectsWidgetFitList = lazy(() =>
  import("./projects-widget-fit-list").then((m) => ({
    default: m.ProjectsWidgetFitList,
  }))
)

/** Home dashboard's Your Projects widget: Default project first. Mobile caps the list to 3 project
 * rows with a "+N more" link to the Projects dashboard (home-projects-widget spec); desktop has
 * room to show every non-archived project uncapped, in a grid across the full-width card. The
 * header links to the Projects dashboard. */
export function ProjectsWidget() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const result = useHomeProjects(isMobile ? 3 : null)

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

    const listProps = {
      projects: result.projects,
      summaries: result.summaries,
      onSelect: (projectId: string) =>
        void navigate(`/plan/goals?project=${projectId}`),
    }
    return (
      <div className="flex flex-col gap-3">
        <Suspense fallback={<ProjectsWidgetList {...listProps} />}>
          <ProjectsWidgetFitList {...listProps} />
        </Suspense>
        {result.remainingCount > 0 ? (
          <Button
            className="self-start"
            data-testid="home-projects-more"
            onClick={() => void navigate("/plan/projects")}
            size="sm"
            variant="ghost"
          >
            {t("home.projects.moreCount", { count: result.remainingCount })}
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
