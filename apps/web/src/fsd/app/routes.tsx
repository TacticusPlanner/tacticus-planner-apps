// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy, type ReactNode } from "react"
import { Navigate, type RouteObject } from "react-router"
import { Spinner } from "@workspace/ui/components/spinner"

import { InteractionStatus } from "@azure/msal-browser"
import { useIsAuthenticated, useMsal } from "@azure/msal-react"

import { LandingPage } from "@/pages/landing"
import { routes as goalsRoutes } from "@/pages/goals"
import { routes as guildRoutes } from "@/pages/guild"
import { routes as lookupRoutes } from "@/pages/lookup"
import { routes as progressRoutes } from "@/pages/progress"
import { isUiKitEnabled } from "@/shared/config"

import { AppShell } from "./layout/app-shell"
import { OnboardingGate } from "./onboarding-gate"

// Everything but the landing page (the one route an unauthenticated first-time visitor always
// hits) is lazy-loaded — each becomes its own chunk, fetched only when its route is entered
// (the layout's <Suspense fallback={<LoadingFill />}> around <Outlet /> covers the wait). Each
// page owns its own nested `children` route config (see e.g. pages/goals/route.tsx) — this module
// only lazy-loads each section's top-level layout/page element and splices the page's own
// `routes` export in as `children`, keeping AppShell and ProtectedRoute central.
const HomePage = lazy(() =>
  import("@/pages/home").then((m) => ({ default: m.HomePage }))
)
const DailiesPage = lazy(() =>
  import("@/pages/dailies").then((m) => ({ default: m.DailiesPage }))
)
const LookupPage = lazy(() =>
  import("@/pages/lookup").then((m) => ({ default: m.LookupPage }))
)
const UiKitPage = lazy(() =>
  import("@/pages/ui-kit").then((m) => ({ default: m.UiKitPage }))
)
const GuildPage = lazy(() =>
  import("@/pages/guild").then((m) => ({ default: m.GuildPage }))
)
const GoalsLayout = lazy(() =>
  import("@/pages/goals").then((m) => ({ default: m.GoalsLayout }))
)
const ProgressLayout = lazy(() =>
  import("@/pages/progress").then((m) => ({ default: m.ProgressLayout }))
)
// A different page slice (pages/onslaught) nested under "/progress" — kept here rather than in
// pages/progress/route.tsx since FSD forbids one page slice importing another's internals.
const OnslaughtPage = lazy(() =>
  import("@/pages/onslaught").then((m) => ({ default: m.OnslaughtPage }))
)

// msal-react's MsalProvider always mounts with `accounts: []`/`inProgress: Startup`, even when the
// underlying instance already restored an active account before the app rendered (see
// shared/auth's initializeAuthentication) — it only picks up the real state a tick later, inside its
// own effect. Every route guard below must wait for `inProgress` to clear before trusting
// `isAuthenticated`; deciding on the stale first-render value is what caused a hard refresh on a
// protected deep link (e.g. /guild/members) to bounce to "/" before MSAL had a chance to catch up.
function AuthResolving() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner className="size-8 text-primary" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated()
  const { inProgress } = useMsal()

  if (inProgress !== InteractionStatus.None) {
    return <AuthResolving />
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/" />
  }

  return <OnboardingGate>{children}</OnboardingGate>
}

function LandingRoute() {
  const isAuthenticated = useIsAuthenticated()
  const { inProgress } = useMsal()

  if (inProgress !== InteractionStatus.None) {
    return <AuthResolving />
  }

  if (isAuthenticated) {
    return <Navigate replace to="/home" />
  }

  return <LandingPage />
}

// MSAL redirects back to /auth/callback (see shared/auth redirectUri); resolve auth then route on.
function AuthCallbackRoute() {
  const isAuthenticated = useIsAuthenticated()
  const { inProgress } = useMsal()

  if (inProgress !== InteractionStatus.None) {
    return <AuthResolving />
  }

  return <Navigate replace to={isAuthenticated ? "/home" : "/"} />
}

// React Router v8 data-mode route config (consumed by createBrowserRouter in app/index.tsx). Auth guards
// are plain element wrappers — no loaders are needed yet.
export const routes: RouteObject[] = [
  { path: "/", element: <LandingRoute /> },
  { path: "/auth/callback", element: <AuthCallbackRoute /> },
  {
    element: <AppShell />,
    children: [
      {
        path: "/home",
        element: (
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/dailies",
        element: (
          <ProtectedRoute>
            <DailiesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/lookup",
        element: <LookupPage />,
        children: lookupRoutes,
      },
      {
        path: "/goals",
        element: (
          <ProtectedRoute>
            <GoalsLayout />
          </ProtectedRoute>
        ),
        children: goalsRoutes,
      },
      {
        path: "/progress",
        element: (
          <ProtectedRoute>
            <ProgressLayout />
          </ProtectedRoute>
        ),
        children: [
          ...progressRoutes,
          { path: "onslaught", element: <OnslaughtPage /> },
        ],
      },
      {
        path: "/guild",
        element: (
          <ProtectedRoute>
            <GuildPage />
          </ProtectedRoute>
        ),
        children: guildRoutes,
      },
      // Public component showcase for local/QA use — never registered in production (see
      // shared/config's isUiKitEnabled), so it 404s (falls through to the "*" redirect below)
      // there regardless of how someone reaches the URL.
      ...(isUiKitEnabled ? [{ path: "/ui-kit", element: <UiKitPage /> }] : []),
      { path: "*", element: <Navigate replace to="/" /> },
    ],
  },
]
