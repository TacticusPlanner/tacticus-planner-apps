// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"

const GuildMembersRoute = lazy(() =>
  import("./ui/guild-members-route").then((m) => ({
    default: m.GuildMembersRoute,
  }))
)

// Nested under "/guild" — see app/routes.tsx, which owns the top-level path, the layout element,
// and the ProtectedRoute wrapping, and just splices this array in as `children`.
export const routes: RouteObject[] = [
  { index: true, element: <Navigate replace to="/guild/members" /> },
  { path: "members", element: <GuildMembersRoute /> },
]
