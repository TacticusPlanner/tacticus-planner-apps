// This is the route-config module (it exports the `routes` arrays, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"

import { FeatureGate } from "@/shared/feature-flags"
import { preloadOnMatch } from "@/shared/lib"

// The section layout, lazy-loaded by app/routes.tsx (exported from here so the page's public API
// never statically pulls the layout into the entry chunk).
const loadMyGameLayout = () =>
  import("./ui/my-game-layout").then((m) => ({ default: m.MyGameLayout }))
export const MyGameLayout = lazy(loadMyGameLayout)
export const preloadMyGameLayout = preloadOnMatch(loadMyGameLayout)

const loadCollectionPage = () =>
  import("./ui/collection/collection-page").then((m) => ({
    default: m.CollectionPage,
  }))
const CollectionPage = lazy(loadCollectionPage)
const loadCampaignsPage = () =>
  import("./ui/campaigns-page").then((m) => ({ default: m.CampaignsPage }))
const CampaignsPage = lazy(loadCampaignsPage)
const loadCampaignEventsPage = () =>
  import("./ui/campaign-events-page").then((m) => ({
    default: m.CampaignEventsPage,
  }))
const CampaignEventsPage = lazy(loadCampaignEventsPage)
const loadIncursionsPage = () =>
  import("./ui/incursions-page").then((m) => ({
    default: m.IncursionsPage,
  }))
const IncursionsPage = lazy(loadIncursionsPage)

// Nested under "/my-game" — see app/routes.tsx, which owns the top-level path and the layout
// element. My Game mixes a public page with sign-in-only ones, so the routes come in two lists:
// app/routes.tsx mounts `publicRoutes` as they are and wraps each of `protectedRoutes` in its
// ProtectedRoute (which this page slice cannot import). The "onslaught" child lives in
// app/routes.tsx too: it's a *different* page slice (pages/onslaught), and FSD forbids one page
// slice importing another's internals directly.
export const publicRoutes: RouteObject[] = [
  { index: true, element: <Navigate replace to="/my-game/collection" /> },
  {
    path: "collection",
    element: <CollectionPage />,
    loader: preloadOnMatch(loadCollectionPage),
  },
]

export const protectedRoutes: RouteObject[] = [
  {
    path: "campaigns",
    element: <CampaignsPage />,
    loader: preloadOnMatch(loadCampaignsPage),
  },
  {
    path: "campaign-events",
    element: <CampaignEventsPage />,
    loader: preloadOnMatch(loadCampaignEventsPage),
  },
  // Behind the Incursion feature flag: while it is off the path falls back to Collection.
  {
    path: "incursions",
    element: (
      <FeatureGate
        flag="Incursion"
        fallback={<Navigate replace to="/my-game/collection" />}
      >
        <IncursionsPage />
      </FeatureGate>
    ),
    loader: preloadOnMatch(loadIncursionsPage),
  },
]
