import { Navigate } from "react-router"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { useProjects } from "@/entities/project"

/**
 * The Plan section's bare `/goals` landing (`app-navigation`'s "Entering a section navigates to
 * its last-visited child..." requirement, Plan's own default-child resolution): Current plan's
 * project detail route, falling back to the Default project, then to All Goals when the account
 * has no projects yet or the project list fails to load. Reached both by the mobile bottom-nav
 * entry (every activation, no last-visited memory there) and the desktop sidebar's first entry
 * into Plan this session (`use-section-entry-path.ts` returns bare `/goals` until a child has
 * been visited) - every other, already-visited child route is unaffected by this component.
 */
export function DefaultGoalsLanding() {
  const { activeProjectId, defaultProjectId, loading } = useProjects()

  if (loading) {
    return (
      <div
        className="flex flex-col gap-3"
        data-testid="default-goals-landing-loading"
      >
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  const targetProjectId = activeProjectId ?? defaultProjectId
  return (
    <Navigate
      replace
      to={
        targetProjectId
          ? `/goals/projects/${targetProjectId}`
          : "/goals/overview"
      }
    />
  )
}
