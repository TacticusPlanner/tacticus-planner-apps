import { ChevronDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { useEventProjects } from "@/features/project-management"

/** A Legendary Event row's plan action: the project targeting the event, a menu when several do,
 *  or the event's plan wizard when none does (or projects can't be read). A sibling of the row's
 *  own link, never nested in it. */
export function LegendaryEventPlanButton({ eventId }: { eventId: string }) {
  const { t } = useTranslation("common")
  const state = useEventProjects(eventId)

  if (state.status === "loading") {
    return <Skeleton className="h-7 w-24 rounded-md" />
  }

  const projects = state.status === "ready" ? state.projects : []
  const [only] = projects
  if (projects.length === 1 && only) {
    return (
      <Button asChild data-testid="home-le-project" size="sm" variant="outline">
        <Link to={`/plan/goals?project=${only.project.projectId}`}>
          {t("home.events.openProject")}
        </Link>
      </Button>
    )
  }
  if (projects.length > 1) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button data-testid="home-le-projects" size="sm" variant="outline">
            {t("home.events.projects", { count: projects.length })}
            <ChevronDown data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {projects.map(({ project }) => (
            <DropdownMenuItem asChild key={project.projectId}>
              <Link to={`/plan/goals?project=${project.projectId}`}>
                {project.name}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  return (
    <Button asChild data-testid="home-le-plan" size="sm" variant="outline">
      <Link to={`/legendary-events/${eventId}/plan`}>
        {t("home.events.planEvent")}
      </Link>
    </Button>
  )
}
