// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"

const CampaignsPage = lazy(() =>
  import("./ui/campaigns-page").then((m) => ({ default: m.CampaignsPage }))
)
const CampaignEventsPage = lazy(() =>
  import("./ui/campaign-events-page").then((m) => ({
    default: m.CampaignEventsPage,
  }))
)
const XpIncomePlaceholderPage = lazy(() =>
  import("./ui/xp-income-placeholder-page").then((m) => ({
    default: m.XpIncomePlaceholderPage,
  }))
)

// Nested under "/progress" — see app/routes.tsx, which owns the top-level path, the layout
// element, and the ProtectedRoute wrapping, and just splices this array in as `children`. The
// "onslaught" child lives in app/routes.tsx instead of here: it's a *different* page slice
// (pages/onslaught), and FSD forbids one page slice importing another's internals directly.
export const routes: RouteObject[] = [
  { index: true, element: <Navigate replace to="/progress/onslaught" /> },
  { path: "campaigns", element: <CampaignsPage /> },
  { path: "campaign-events", element: <CampaignEventsPage /> },
  { path: "xp-income", element: <XpIncomePlaceholderPage /> },
]
