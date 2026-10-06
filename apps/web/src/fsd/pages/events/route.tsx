// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy } from "react"
import { Navigate, type RouteObject } from "react-router"

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

// Nested under "/events" — app/routes.tsx owns the top-level path, the layout element and the
// ProtectedRoute wrapping, and splices this array in as `children`.
export const routes: RouteObject[] = [
  { index: true, element: <Navigate replace to="/events/legendary-events" /> },
  { path: "legendary-events", element: <LegendaryEventsHubPage /> },
  { path: "legendary-events/:eventId", element: <LegendaryEventPage /> },
]
