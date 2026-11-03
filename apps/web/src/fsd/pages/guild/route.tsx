// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"

import { preloadOnMatch } from "@/shared/lib"

// The section layout, lazy-loaded by app/routes.tsx (exported from here so the page's public API
// never statically pulls the layout into the entry chunk).
const loadGuildPage = () =>
  import("./ui/guild-page").then((m) => ({ default: m.GuildPage }))
export const GuildPage = lazy(loadGuildPage)
export const preloadGuildPage = preloadOnMatch(loadGuildPage)

const loadGuildMembersRoute = () =>
  import("./ui/guild-members-route").then((m) => ({
    default: m.GuildMembersRoute,
  }))
const GuildMembersRoute = lazy(loadGuildMembersRoute)

// Ships in the Guild page chunk rather than its own: a chunk that uses `useMutation` without
// `useQuery` makes Rollup split react-query's shared `Removable` base out of the startup graph's
// `useQuery` chunk, which costs startup bytes (see scripts/bundle-budget.mjs).
const loadGuildSettingsRoute = () =>
  import("./ui/guild-page").then((m) => ({
    default: m.GuildSettingsRoute,
  }))
const GuildSettingsRoute = lazy(loadGuildSettingsRoute)

// Nested under "/guild" — see app/routes.tsx, which owns the top-level path, the layout element,
// and the ProtectedRoute wrapping, and just splices this array in as `children`.
export const routes: RouteObject[] = [
  { index: true, element: <Navigate replace to="/guild/members" /> },
  {
    path: "members",
    element: <GuildMembersRoute />,
    loader: preloadOnMatch(loadGuildMembersRoute),
  },
  {
    path: "settings",
    element: <GuildSettingsRoute />,
    loader: preloadOnMatch(loadGuildSettingsRoute),
  },
]
