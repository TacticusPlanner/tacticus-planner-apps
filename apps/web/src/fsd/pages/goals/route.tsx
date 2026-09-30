// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"

const GoalsPage = lazy(() =>
  import("./ui/goals-board/goals-page").then((m) => ({ default: m.GoalsPage }))
)
const ProjectsListPage = lazy(() =>
  import("./ui/projects/projects-list-page").then((m) => ({
    default: m.ProjectsListPage,
  }))
)
const InsightsPage = lazy(() =>
  import("./ui/insights/insights-page").then((m) => ({
    default: m.InsightsPage,
  }))
)
const SchedulePage = lazy(() =>
  import("./ui/schedule/schedule-page").then((m) => ({
    default: m.SchedulePage,
  }))
)

// Nested under "/plan" — see app/routes.tsx, which owns the top-level path, the layout element,
// and the ProtectedRoute wrapping, and just splices this array in as `children`. Plan has a fixed
// landing (Goals), like every other section: the index replaces itself with `goals`.
export const routes: RouteObject[] = [
  { index: true, element: <Navigate replace to="goals" /> },
  { path: "goals", element: <GoalsPage /> },
  { path: "projects", element: <ProjectsListPage /> },
  { path: "insights", element: <InsightsPage /> },
  { path: "schedule", element: <SchedulePage /> },
]
