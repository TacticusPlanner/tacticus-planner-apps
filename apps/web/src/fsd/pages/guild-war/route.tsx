// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate } from "react-router"
import type { RouteObject } from "react-router"

import { redirectOnlyHandle } from "@/shared/analytics"
import { preloadOnMatch } from "@/shared/lib"

// The group layout, lazy-loaded by app/routes.tsx (exported from here so the page's public API
// never statically pulls the layout into the entry chunk).
const loadGuildWarLayout = () =>
  import("./ui/guild-war-layout").then((m) => ({ default: m.GuildWarLayout }))
export const GuildWarLayout = lazy(loadGuildWarLayout)
export const preloadGuildWarLayout = preloadOnMatch(loadGuildWarLayout)

const loadOffensePage = () =>
  import("./ui/offense/offense-page").then((m) => ({
    default: m.OffensePage,
  }))
const OffensePage = lazy(loadOffensePage)

const loadHistoryPage = () =>
  import("./ui/history/history-page").then((m) => ({
    default: m.HistoryPage,
  }))
const HistoryPage = lazy(loadHistoryPage)

// Nested under "/guild/war" — see app/routes.tsx, which owns the path, the layout element and the
// ProtectedRoute wrapping, and splices this array in as `children`.
export const routes: RouteObject[] = [
  {
    index: true,
    element: <Navigate replace to="/guild/war/offense" />,
    // Only redirects: no page view of its own.
    handle: redirectOnlyHandle,
  },
  {
    path: "offense",
    element: <OffensePage />,
    loader: preloadOnMatch(loadOffensePage),
  },
  {
    path: "history",
    element: <HistoryPage />,
    loader: preloadOnMatch(loadHistoryPage),
  },
]
