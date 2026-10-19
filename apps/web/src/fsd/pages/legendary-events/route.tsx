// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import type { RouteObject } from "react-router"

const LegendaryEventsHubPage = lazy(() =>
  import("./ui/legendary-events-hub/legendary-events-hub-page").then((m) => ({
    default: m.LegendaryEventsHubPage,
  }))
)
const MasterTablePage = lazy(() =>
  import("./ui/master-table/master-table-page").then((m) => ({
    default: m.MasterTablePage,
  }))
)
const TierListPage = lazy(() =>
  import("./ui/tier-list/tier-list-page").then((m) => ({
    default: m.TierListPage,
  }))
)
const PlanWizardPage = lazy(() =>
  import("./ui/plan-wizard/plan-wizard-page").then((m) => ({
    default: m.PlanWizardPage,
  }))
)
const LegendaryEventPage = lazy(() =>
  import("./ui/legendary-event/legendary-event-page").then((m) => ({
    default: m.LegendaryEventPage,
  }))
)

// Nested under "/legendary-events" — app/routes.tsx owns the top-level path, the layout element and
// the ProtectedRoute wrapping, and splices this array in as `children`. The old "/events/*" paths
// have no redirect (design D2): they fall through to the app's not-found redirect.
export const routes: RouteObject[] = [
  { index: true, element: <LegendaryEventsHubPage /> },
  // Static children before `:eventId`, so neither path is ever read as an event id.
  { path: "master-table", element: <MasterTablePage /> },
  { path: "tier-list", element: <TierListPage /> },
  { path: ":eventId", element: <LegendaryEventPage /> },
  { path: ":eventId/plan", element: <PlanWizardPage /> },
]
