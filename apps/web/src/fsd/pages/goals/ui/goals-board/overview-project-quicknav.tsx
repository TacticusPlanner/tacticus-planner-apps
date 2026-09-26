import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router"
import { Plus } from "lucide-react"
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
  orderDefaultFirst,
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
  /** Opens the blank project-creation sheet hosted by `GoalsPage`. */
  onCreateProject: () => void
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
  onCreateProject,
}: Props) {
  const isMobile = useIsMobile()
  return isMobile ? (
    <MobileQuicknav onCreateProject={onCreateProject} />
  ) : (
    <DesktopQuicknav
      failed={projectsFailed}
      loading={projectsLoading}
      onCreateProject={onCreateProject}
      projects={projects}
    />
  )
}

/** The one Create project control, rendered outside every per-state branch so it stays available
 *  while the list is loading, failed, empty or populated (`overview-project-quicknav` spec). */
function CreateProjectButton({
  onClick,
  touch,
}: {
  onClick: () => void
  touch?: boolean
}) {
  const { t } = useTranslation()
  return (
    <Button
      className={touch ? "w-full" : "shrink-0"}
      data-testid="overview-quicknav-create-project"
      onClick={onClick}
      size={touch ? "lg" : "sm"}
      variant="outline"
    >
      <Plus data-icon="inline-start" />
      {t("goals.project.newProject")}
    </Button>
  )
}

function MobileQuicknav({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <MobileProjects />
      <CreateProjectButton onClick={onCreateProject} touch />
    </div>
  )
}

function MobileProjects() {
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
        {/* The card's own "go to Projects" action is hidden here: Create project is the single action. */}
        <CardContent className="text-sm text-muted-foreground">
          {t("home.projects.emptyDescription")}
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
                  void navigate(`/plan/projects/${project.projectId}`)
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
              onClick={() => void navigate("/plan/projects")}
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
  onCreateProject,
}: {
  projects: ProjectSummary[]
  loading: boolean
  failed: boolean
  onCreateProject: () => void
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
        <CreateProjectButton onClick={onCreateProject} />
      </div>
    )
  }

  const ordered = failed ? [] : orderDefaultFirst(projects)
  // A failed or empty list has no chips to show, but the row still holds the Create project control.
  if (ordered.length === 0) {
    return (
      <div
        className="flex items-center gap-2"
        data-testid="overview-quicknav-create-only"
      >
        <CreateProjectButton onClick={onCreateProject} />
      </div>
    )
  }

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
          onClick={() => void navigate(`/plan/projects/${project.projectId}`)}
          type="button"
        >
          <ProjectColorDot color={project.color} />
          <span className="truncate">{project.name}</span>
        </button>
      ))}
      <Button
        className="shrink-0"
        data-testid="overview-quicknav-all-projects"
        onClick={() => void navigate("/plan/projects")}
        size="sm"
        variant="ghost"
      >
        {t("goals.project.quicknavAllProjects")}
      </Button>
      <CreateProjectButton onClick={onCreateProject} />
    </nav>
  )
}
