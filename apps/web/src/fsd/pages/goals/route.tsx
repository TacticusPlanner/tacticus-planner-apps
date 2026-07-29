// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import type { RouteObject } from "react-router"

const GoalsPage = lazy(() =>
  import("./ui/goals-board/goals-page").then((m) => ({ default: m.GoalsPage }))
)
const ProjectsPage = lazy(() =>
  import("./ui/projects/projects-page").then((m) => ({
    default: m.ProjectsPage,
  }))
)
const InsightsPage = lazy(() =>
  import("./ui/insights/insights-page").then((m) => ({
    default: m.InsightsPage,
  }))
)

// Nested under "/goals" — see app/routes.tsx, which owns the top-level path, the layout element,
// and the ProtectedRoute wrapping, and just splices this array in as `children`.
export const routes: RouteObject[] = [
  { index: true, element: <GoalsPage /> },
  { path: "project", element: <ProjectsPage /> },
  { path: "insights", element: <InsightsPage /> },
]
