import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import {
  useHomeProjects,
  ProjectSummaryRow,
} from "@/features/project-management"

/** Home dashboard's Your Projects widget: Current plan first, capped to 3 project rows, with a
 * "+N more" link to the Projects dashboard when there are more (home-projects-widget spec). */
export function ProjectsWidget() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const result = useHomeProjects()

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
            onClick={() => void navigate("/goals/projects")}
            size="sm"
          >
            {t("home.projects.emptyAction")}
          </Button>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-3">
        <ul className="flex flex-col gap-2" data-testid="home-projects-list">
          {result.projects.map((project) => (
            <ProjectSummaryRow
              key={project.projectId}
              onSelect={() =>
                void navigate(`/goals/projects/${project.projectId}`)
              }
              project={project}
              summary={result.summaries.get(project.projectId)}
            />
          ))}
        </ul>
        {result.remainingCount > 0 ? (
          <Button
            className="self-start"
            data-testid="home-projects-more"
            onClick={() => void navigate("/goals/projects")}
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
    <Card data-testid="home-projects-widget">
      <CardHeader>
        <CardTitle>{t("home.projects.title")}</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}
