import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { useEventProjects } from "../model/use-event-projects"

/** The Legendary Event Overview's Projects line (project-event-target): the active projects
 *  targeting the event, each linking to that project on Goals, "+N archived", or "No project for
 *  this event" with a link to the Projects page. */
export function EventProjectsLine({ eventId }: { eventId: string }) {
  const { t } = useTranslation()
  const state = useEventProjects(eventId)

  if (state.status === "hidden") return null
  if (state.status === "loading") {
    return (
      <Skeleton className="h-5 w-56" data-testid="event-projects-loading" />
    )
  }

  return (
    <p
      className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm"
      data-testid="event-projects"
    >
      {state.projects.length === 0 ? (
        <>
          <span className="text-muted-foreground">
            {t("goals.project.eventNoProject")}
          </span>
          <Link
            className="underline underline-offset-4"
            data-testid="event-projects-open"
            to="/plan/projects"
          >
            {t("goals.project.eventOpenProjects")}
          </Link>
        </>
      ) : (
        state.projects.map(({ project, goals }) => (
          <Link
            className="underline-offset-4 hover:underline"
            data-testid="event-project"
            key={project.projectId}
            to={`/plan/goals?project=${project.projectId}`}
          >
            {goals === null
              ? t("goals.project.eventProject", { name: project.name })
              : t("goals.project.eventProjectGoals", {
                  name: project.name,
                  count: goals,
                })}
          </Link>
        ))
      )}
      {state.archivedCount > 0 ? (
        <span
          className="text-muted-foreground"
          data-testid="event-projects-archived"
        >
          {t("goals.project.eventArchived", { count: state.archivedCount })}
        </span>
      ) : null}
    </p>
  )
}
