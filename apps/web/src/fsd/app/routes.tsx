// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from "react"
import { Navigate, type RouteObject } from "react-router"
import { GameCatalogProvider } from "@workspace/game-catalog"
import { Spinner } from "@workspace/ui/components/spinner"

import { InteractionStatus } from "@azure/msal-browser"
import { useIsAuthenticated, useMsal } from "@azure/msal-react"

import { UiKitPage } from "@/pages/ui-kit"
import { LandingPage } from "@/pages/landing"

import { GameCatalogInitGate } from "./game-catalog-init-gate"
import { AuthControl } from "./providers/auth-control"
import { CatalogSyncStatusBadge } from "./providers/catalog-sync-status-badge"
import { LanguageSwitcher } from "./providers/language-switcher"
import { ThemeSwitcher } from "./providers/theme-switcher"
import { TourButton } from "./providers/tour-button"

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated()

  if (!isAuthenticated) {
    return <Navigate replace to="/" />
  }

  return <>{children}</>
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

function HomeHeaderActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <CatalogSyncStatusBadge />
      <AuthControl />
      <TourButton />
      <LanguageSwitcher />
      <ThemeSwitcher />
    </div>
  )
}

function HomeRoute() {
  return (
    <GameCatalogProvider baseUrl={apiBaseUrl}>
      <GameCatalogInitGate>
        <UiKitPage headerAction={<HomeHeaderActions />} />
      </GameCatalogInitGate>
    </GameCatalogProvider>
  )
}

// React Router v8 data-mode route config (consumed by createBrowserRouter in app/index.tsx). Auth guards
// are plain element wrappers — no loaders are needed yet.
export const routes: RouteObject[] = [
  { path: "/", element: <LandingRoute /> },
  { path: "/auth/callback", element: <AuthCallbackRoute /> },
  {
    path: "/home",
    element: (
      <ProtectedRoute>
        <HomeRoute />
      </ProtectedRoute>
    ),
  },
  { path: "*", element: <Navigate replace to="/" /> },
]
