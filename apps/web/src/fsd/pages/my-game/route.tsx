// This is the route-config module (it exports the `routes` arrays, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"

const CollectionPage = lazy(() =>
  import("./ui/collection/collection-page").then((m) => ({
    default: m.CollectionPage,
  }))
)
const CampaignsPage = lazy(() =>
  import("./ui/campaigns-page").then((m) => ({ default: m.CampaignsPage }))
)
const CampaignEventsPage = lazy(() =>
  import("./ui/campaign-events-page").then((m) => ({
    default: m.CampaignEventsPage,
  }))
)

// Nested under "/my-game" — see app/routes.tsx, which owns the top-level path and the layout
// element. My Game mixes a public page with sign-in-only ones, so the routes come in two lists:
// app/routes.tsx mounts `publicRoutes` as they are and wraps each of `protectedRoutes` in its
// ProtectedRoute (which this page slice cannot import). The "onslaught" child lives in
// app/routes.tsx too: it's a *different* page slice (pages/onslaught), and FSD forbids one page
// slice importing another's internals directly.
export const publicRoutes: RouteObject[] = [
  { index: true, element: <Navigate replace to="/my-game/collection" /> },
  { path: "collection", element: <CollectionPage /> },
]

export const protectedRoutes: RouteObject[] = [
  { path: "campaigns", element: <CampaignsPage /> },
  { path: "campaign-events", element: <CampaignEventsPage /> },
]
