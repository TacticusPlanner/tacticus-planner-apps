// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import type { RouteObject } from "react-router"

import { DefaultGoalsLanding } from "./ui/default-goals-landing"

const GoalsPage = lazy(() =>
  import("./ui/goals-board/goals-page").then((m) => ({ default: m.GoalsPage }))
)
const ProjectsListPage = lazy(() =>
  import("./ui/projects/projects-list-page").then((m) => ({
    default: m.ProjectsListPage,
  }))
)
const ProjectDetailPage = lazy(() =>
  import("./ui/projects/project-detail-page").then((m) => ({
    default: m.ProjectDetailPage,
  }))
)
const InsightsPage = lazy(() =>
  import("./ui/insights/insights-page").then((m) => ({
    default: m.InsightsPage,
  }))
)

// Nested under "/goals" — see app/routes.tsx, which owns the top-level path, the layout element,
// and the ProtectedRoute wrapping, and just splices this array in as `children`. The index route
// resolves Plan's own dynamic default child (plan-nav-default-landing: Current plan's project,
// falling back to the Default project, then to All Goals) rather than a fixed redirect, so
// Overview/Projects/Insights each keep their own path and matching NavSubItem/header tab.
export const routes: RouteObject[] = [
  { index: true, element: <DefaultGoalsLanding /> },
  { path: "overview", element: <GoalsPage /> },
  { path: "projects", element: <ProjectsListPage /> },
  { path: "projects/:projectId", element: <ProjectDetailPage /> },
  { path: "insights", element: <InsightsPage /> },
]
