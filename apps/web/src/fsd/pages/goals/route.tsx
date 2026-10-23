// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"

import { preloadOnMatch } from "@/shared/lib"

// The section layout, lazy-loaded by app/routes.tsx (exported from here so the page's public API
// never statically pulls the layout into the entry chunk).
const loadGoalsLayout = () =>
  import("./ui/goals-board/goals-layout").then((m) => ({
    default: m.GoalsLayout,
  }))
export const GoalsLayout = lazy(loadGoalsLayout)
export const preloadGoalsLayout = preloadOnMatch(loadGoalsLayout)

const loadGoalsPage = () =>
  import("./ui/goals-board/goals-page").then((m) => ({ default: m.GoalsPage }))
const GoalsPage = lazy(loadGoalsPage)
const loadProjectsListPage = () =>
  import("./ui/projects/projects-list-page").then((m) => ({
    default: m.ProjectsListPage,
  }))
const ProjectsListPage = lazy(loadProjectsListPage)
const loadInsightsPage = () =>
  import("./ui/insights/insights-page").then((m) => ({
    default: m.InsightsPage,
  }))
const InsightsPage = lazy(loadInsightsPage)
const loadSchedulePage = () =>
  import("./ui/schedule/schedule-page").then((m) => ({
    default: m.SchedulePage,
  }))
const SchedulePage = lazy(loadSchedulePage)

// Nested under "/plan" — see app/routes.tsx, which owns the top-level path, the layout element,
// and the ProtectedRoute wrapping, and just splices this array in as `children`. Plan has a fixed
// landing (Goals), like every other section: the index replaces itself with `goals`.
export const routes: RouteObject[] = [
  { index: true, element: <Navigate replace to="goals" /> },
  {
    path: "goals",
    element: <GoalsPage />,
    loader: preloadOnMatch(loadGoalsPage),
  },
  {
    path: "projects",
    element: <ProjectsListPage />,
    loader: preloadOnMatch(loadProjectsListPage),
  },
  {
    path: "insights",
    element: <InsightsPage />,
    loader: preloadOnMatch(loadInsightsPage),
  },
  {
    path: "schedule",
    element: <SchedulePage />,
    loader: preloadOnMatch(loadSchedulePage),
  },
]
