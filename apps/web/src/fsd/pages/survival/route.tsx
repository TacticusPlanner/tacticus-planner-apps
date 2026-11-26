// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate } from "react-router"
import type { RouteObject } from "react-router"

import { redirectOnlyHandle } from "@/shared/analytics"
import { preloadOnMatch } from "@/shared/lib"

// The page layout, lazy-loaded by app/routes.tsx (exported from here so the page's public API never
// statically pulls the layout into the entry chunk).
const loadSurvivalLayout = () =>
  import("./ui/survival-layout").then((m) => ({ default: m.SurvivalLayout }))
export const SurvivalLayout = lazy(loadSurvivalLayout)
export const preloadSurvivalLayout = preloadOnMatch(loadSurvivalLayout)

const loadTeamTab = () =>
  import("./ui/team-tab").then((m) => ({ default: m.TeamTab }))
const TeamTab = lazy(loadTeamTab)
const loadEnemiesTab = () =>
  import("./ui/enemies-tab").then((m) => ({ default: m.EnemiesTab }))
const EnemiesTab = lazy(loadEnemiesTab)
const loadRewardsTab = () =>
  import("./ui/rewards-tab").then((m) => ({ default: m.RewardsTab }))
const RewardsTab = lazy(loadRewardsTab)
const loadMissionsTab = () =>
  import("./ui/missions-tab").then((m) => ({ default: m.MissionsTab }))
const MissionsTab = lazy(loadMissionsTab)
const loadOffersTab = () =>
  import("./ui/offers-tab").then((m) => ({ default: m.OffersTab }))
const OffersTab = lazy(loadOffersTab)

// Nested under "/plan/survival" — see app/routes.tsx, which owns the path, the layout element and the
// ProtectedRoute wrapping, and splices this array in as `children`. An unknown tab goes to Team.
export const routes: RouteObject[] = [
  {
    index: true,
    element: <Navigate replace to="/plan/survival/team" />,
    handle: redirectOnlyHandle,
  },
  { path: "team", element: <TeamTab />, loader: preloadOnMatch(loadTeamTab) },
  {
    path: "enemies",
    element: <EnemiesTab />,
    loader: preloadOnMatch(loadEnemiesTab),
  },
  {
    path: "rewards",
    element: <RewardsTab />,
    loader: preloadOnMatch(loadRewardsTab),
  },
  {
    path: "missions",
    element: <MissionsTab />,
    loader: preloadOnMatch(loadMissionsTab),
  },
  {
    path: "offers",
    element: <OffersTab />,
    loader: preloadOnMatch(loadOffersTab),
  },
  {
    path: "*",
    element: <Navigate replace to="/plan/survival/team" />,
    handle: redirectOnlyHandle,
  },
]
