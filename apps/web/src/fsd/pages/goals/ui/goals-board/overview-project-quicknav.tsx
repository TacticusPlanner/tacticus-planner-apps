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
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { ProjectColorDot, type ProjectSummary } from "@/entities/project"
import {
  orderCurrentPlanFirst,
  useHomeProjects,
  ProjectSummaryRow,
} from "@/features/project-management"

type Props = {
  /** Desktop's chip row is sourced from the caller's own already-fetched project list (`GoalsPage`
   *  already calls `useProjects()` for its own project-membership filter) rather than a second,
   *  independent `useProjects()` subscription here — one fewer query observer on the page, and
   *  avoids a real render race this was seen to cause against a Radix `Select` open elsewhere on the
   *  same page in tests. Mobile is unaffected: it's a self-contained `useHomeProjects` call, the
   *  same shape `ProjectsWidget` uses standalone on the home page. */
  projects: ProjectSummary[]
  projectsLoading: boolean
  projectsFailed: boolean
}

/** Goals Overview's project quick-nav (`overview-project-quicknav` spec): a way to jump straight
 * into a project's detail route without first visiting the Projects dashboard. Mobile reuses the
 * home page's Your Projects widget behavior exactly (via the same feature-level `useHomeProjects`/
 * `ProjectSummaryRow` pieces `ProjectsWidget` is built from — importing `pages/home`'s component
 * directly would violate the page-to-page FSD boundary). Desktop is a lighter, uncapped,
 * horizontally-scrollable chip row: it does not use `useHomeProjects`, since that hook fetches a
 * per-project goals summary the desktop chip never shows. */
export function OverviewProjectQuicknav({
  projects,
  projectsLoading,
  projectsFailed,
}: Props) {
  const isMobile = useIsMobile()
  return isMobile ? (
    <MobileQuicknav />
  ) : (
    <DesktopQuicknav
      failed={projectsFailed}
      loading={projectsLoading}
      projects={projects}
    />
  )
}

function MobileQuicknav() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const result = useHomeProjects(3)

  if (result.status === "loading") {
    return (
      <div
        className="flex flex-col gap-2"
        data-testid="overview-quicknav-loading"
      >
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    )
  }
  if (result.status === "error") {
    return (
      <div
        className="flex flex-col gap-2"
        data-testid="overview-quicknav-error"
      >
        <p className="text-sm text-destructive">{t("home.projects.error")}</p>
        <Button onClick={result.retry} size="sm" variant="outline">
          {t("home.projects.retry")}
        </Button>
      </div>
    )
  }
  if (result.status === "empty") {
    return (
      <Card data-testid="overview-quicknav-empty">
        <CardHeader>
          <CardTitle>{t("home.projects.emptyTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3 text-sm text-muted-foreground">
          {t("home.projects.emptyDescription")}
          <Button onClick={() => void navigate("/goals/projects")} size="sm">
            {t("home.projects.emptyAction")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-testid="overview-quicknav-mobile">
      <CardHeader>
        <CardTitle>{t("home.projects.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <ul
            className="flex flex-col gap-2"
            data-testid="overview-quicknav-list"
          >
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
              data-testid="overview-quicknav-more"
              onClick={() => void navigate("/goals/projects")}
              size="sm"
              variant="ghost"
            >
              {t("home.projects.moreCount", { count: result.remainingCount })}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function DesktopQuicknav({
  projects,
  loading,
  failed,
}: {
  projects: ProjectSummary[]
  loading: boolean
  failed: boolean
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div
        className="flex items-center gap-2 overflow-x-auto overflow-y-hidden"
        data-testid="overview-quicknav-loading"
      >
        <Skeleton className="h-8 w-24 shrink-0 rounded-full" />
        <Skeleton className="h-8 w-24 shrink-0 rounded-full" />
        <Skeleton className="h-8 w-24 shrink-0 rounded-full" />
      </div>
    )
  }
  if (failed) return null

  const ordered = orderCurrentPlanFirst(projects)
  if (ordered.length === 0) return null

  return (
    <nav
      aria-label={t("goals.project.quicknavLabel")}
      className="flex items-center gap-2 overflow-x-auto overflow-y-hidden"
      data-testid="overview-quicknav-desktop"
    >
      {ordered.map((project) => (
        <button
          className="flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          data-testid={`overview-quicknav-chip-${project.projectId}`}
          key={project.projectId}
          onClick={() => void navigate(`/goals/projects/${project.projectId}`)}
          type="button"
        >
          <ProjectColorDot color={project.color} />
          <span className="truncate">{project.name}</span>
        </button>
      ))}
      <Button
        className="shrink-0"
        data-testid="overview-quicknav-all-projects"
        onClick={() => void navigate("/goals/projects")}
        size="sm"
        variant="ghost"
      >
        {t("goals.project.quicknavAllProjects")}
      </Button>
    </nav>
  )
}
