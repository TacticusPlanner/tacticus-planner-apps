// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy, type ReactNode } from "react"
import { Navigate, type RouteObject } from "react-router"
import { Spinner } from "@workspace/ui/components/spinner"

import { InteractionStatus } from "@azure/msal-browser"
import { useIsAuthenticated, useMsal } from "@azure/msal-react"

import { LandingPage } from "@/pages/landing"
import { isUiKitEnabled } from "@/shared/config"

import { AppShell } from "./layout/app-shell"
import { OnboardingGate } from "./onboarding-gate"

// Everything but the landing page (the one route an unauthenticated first-time visitor always
// hits) is lazy-loaded — each becomes its own chunk, fetched only when its route is entered
// (the layout's <Suspense fallback={<LoadingFill />}> around <Outlet /> covers the wait).
const HomePage = lazy(() =>
  import("@/pages/home").then((m) => ({ default: m.HomePage }))
)
const LookupPage = lazy(() =>
  import("@/pages/lookup").then((m) => ({ default: m.LookupPage }))
)
const CharacterLookupPage = lazy(() =>
  import("@/pages/lookup").then((m) => ({ default: m.CharacterLookupPage }))
)
const LookupPlaceholder = lazy(() =>
  import("@/pages/lookup").then((m) => ({ default: m.LookupPlaceholder }))
)
const UiKitPage = lazy(() =>
  import("@/pages/ui-kit").then((m) => ({ default: m.UiKitPage }))
)
const GuildPage = lazy(() =>
  import("@/pages/guild").then((m) => ({ default: m.GuildPage }))
)

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated()

  if (!isAuthenticated) {
    return <Navigate replace to="/" />
  }

  return <OnboardingGate>{children}</OnboardingGate>
}

function LandingRoute() {
  const isAuthenticated = useIsAuthenticated()

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
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
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
        path: "/lookup",
        element: <LookupPage />,
        children: [
          { index: true, element: <Navigate replace to="/lookup/character" /> },
          { path: "character", element: <CharacterLookupPage /> },
          { path: "mow", element: <LookupPlaceholder tab="mow" /> },
          { path: "npc", element: <LookupPlaceholder tab="npc" /> },
        ],
      },
      {
        path: "/guild",
        element: (
          <ProtectedRoute>
            <GuildPage />
          </ProtectedRoute>
        ),
      },
      // Public component showcase for local/QA use — never registered in production (see
      // shared/config's isUiKitEnabled), so it 404s (falls through to the "*" redirect below)
      // there regardless of how someone reaches the URL.
      ...(isUiKitEnabled ? [{ path: "/ui-kit", element: <UiKitPage /> }] : []),
      { path: "*", element: <Navigate replace to="/" /> },
    ],
  },
]
