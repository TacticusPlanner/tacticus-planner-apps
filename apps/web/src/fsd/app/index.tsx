import type { ReactNode } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { CatalogProvider } from "@workspace/game-catalog"
import { Spinner } from "@workspace/ui/components/spinner"
import { Toaster } from "@workspace/ui/components/sonner"

import { InteractionStatus } from "@azure/msal-browser"
import { useIsAuthenticated, useMsal } from "@azure/msal-react"

import { UiKitPage } from "@/pages/ui-kit"
import { LandingPage } from "@/pages/landing"
import { CatalogInitGate } from "@/widgets/catalog-init"

import { AuthControl } from "./providers/auth-control"
import { CatalogSyncStatusBadge } from "./providers/catalog-sync-status-badge"
import { LanguageSwitcher } from "./providers/language-switcher"
import { ThemeSwitcher } from "./providers/theme-switcher"
import { TourButton } from "./providers/tour-button"
import { useTheme } from "./providers/theme-provider"

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

function RedirectRoute() {
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
    <CatalogProvider baseUrl={apiBaseUrl}>
      <CatalogInitGate>
        <UiKitPage headerAction={<HomeHeaderActions />} />
      </CatalogInitGate>
    </CatalogProvider>
  )
}

export function App() {
  const { theme } = useTheme()

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<LandingRoute />} path="/" />
        <Route element={<RedirectRoute />} path="/redirect" />
        <Route
          element={
            <ProtectedRoute>
              <HomeRoute />
            </ProtectedRoute>
          }
          path="/home"
        />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
      <Toaster theme={theme} />
    </BrowserRouter>
  )
}
