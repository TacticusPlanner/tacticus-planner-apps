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
  { path: ":eventId", element: <LegendaryEventPage /> },
]
