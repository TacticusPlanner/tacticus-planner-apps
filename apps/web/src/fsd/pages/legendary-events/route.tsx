// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import type { RouteObject } from "react-router"

import { preloadOnMatch } from "@/shared/lib"

// The section layout, lazy-loaded by app/routes.tsx (exported from here so the page's public API
// never statically pulls the layout into the entry chunk).
const loadLegendaryEventsLayout = () =>
  import("./ui/legendary-events-layout").then((m) => ({
    default: m.LegendaryEventsLayout,
  }))
export const LegendaryEventsLayout = lazy(loadLegendaryEventsLayout)
export const preloadLegendaryEventsLayout = preloadOnMatch(
  loadLegendaryEventsLayout
)

const loadLegendaryEventsHubPage = () =>
  import("./ui/legendary-events-hub/legendary-events-hub-page").then((m) => ({
    default: m.LegendaryEventsHubPage,
  }))
const LegendaryEventsHubPage = lazy(loadLegendaryEventsHubPage)
const loadMasterTablePage = () =>
  import("./ui/master-table/master-table-page").then((m) => ({
    default: m.MasterTablePage,
  }))
const MasterTablePage = lazy(loadMasterTablePage)
const loadTierListPage = () =>
  import("./ui/tier-list/tier-list-page").then((m) => ({
    default: m.TierListPage,
  }))
const TierListPage = lazy(loadTierListPage)
const loadPlanWizardPage = () =>
  import("./ui/plan-wizard/plan-wizard-page").then((m) => ({
    default: m.PlanWizardPage,
  }))
const PlanWizardPage = lazy(loadPlanWizardPage)
const loadLegendaryEventPage = () =>
  import("./ui/legendary-event/legendary-event-page").then((m) => ({
    default: m.LegendaryEventPage,
  }))
const LegendaryEventPage = lazy(loadLegendaryEventPage)

// Nested under "/legendary-events" — app/routes.tsx owns the top-level path, the layout element and
// the ProtectedRoute wrapping, and splices this array in as `children`. The old "/events/*" paths
// have no redirect (design D2): they fall through to the app's not-found redirect.
export const routes: RouteObject[] = [
  {
    index: true,
    element: <LegendaryEventsHubPage />,
    loader: preloadOnMatch(loadLegendaryEventsHubPage),
  },
  // Static children before `:eventId`, so neither path is ever read as an event id.
  {
    path: "master-table",
    element: <MasterTablePage />,
    loader: preloadOnMatch(loadMasterTablePage),
  },
  {
    path: "tier-list",
    element: <TierListPage />,
    loader: preloadOnMatch(loadTierListPage),
  },
  {
    path: ":eventId",
    element: <LegendaryEventPage />,
    loader: preloadOnMatch(loadLegendaryEventPage),
  },
  {
    path: ":eventId/plan",
    element: <PlanWizardPage />,
    loader: preloadOnMatch(loadPlanWizardPage),
  },
]
