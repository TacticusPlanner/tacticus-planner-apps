// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"

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
// and the ProtectedRoute wrapping, and just splices this array in as `children`. The index route
// redirects to "overview" (mirroring lookup/route.tsx's pattern) so the Board page has its own
// path and a matching NavSubItem/header tab, rather than living unlisted at "/goals" itself.
export const routes: RouteObject[] = [
  { index: true, element: <Navigate replace to="/goals/overview" /> },
  { path: "overview", element: <GoalsPage /> },
  { path: "project", element: <ProjectsPage /> },
  { path: "insights", element: <InsightsPage /> },
]
