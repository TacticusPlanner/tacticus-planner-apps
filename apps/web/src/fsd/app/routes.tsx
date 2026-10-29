// This is the route-config module (it exports the `routes` array, not a component), so Fast Refresh's
// "only export components" rule does not apply.
/* eslint-disable react-refresh/only-export-components */
import { lazy, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, type RouteObject } from "react-router"

import { useIsAuthenticated } from "@azure/msal-react"

import {
  routes as dailiesRoutes,
  DailiesLayout,
  preloadDailiesLayout,
} from "@/pages/dailies"
import {
  routes as goalsRoutes,
  GoalsLayout,
  preloadGoalsLayout,
} from "@/pages/goals"
import {
  routes as guildRoutes,
  GuildPage,
  preloadGuildPage,
} from "@/pages/guild"
import {
  routes as legendaryEventsRoutes,
  LegendaryEventsLayout,
  preloadLegendaryEventsLayout,
} from "@/pages/legendary-events"
import {
  routes as libraryRoutes,
  LibraryPage,
  preloadLibraryPage,
} from "@/pages/library"
import {
  MyGameLayout,
  preloadMyGameLayout,
  protectedRoutes as myGameProtectedRoutes,
  publicRoutes as myGamePublicRoutes,
} from "@/pages/my-game"
import { isUiKitEnabled } from "@/shared/config"
import { preloadOnMatch } from "@/shared/lib"

import { accountSetupRoutes } from "./account-setup-routes"
import {
  AuthResolving,
  AuthenticatedRoute,
  LandingRoute,
} from "./auth-route-guards"
import { AccountSetupLayout } from "./layout/account-setup-layout"
import { AppShell } from "./layout/app-shell"
import { PublicLayout } from "./layout/public-layout"
import { OnboardingGate } from "./onboarding-gate"
import { RouteErrorBoundary } from "./route-error-boundary"
import { useAuthPending } from "./use-auth-pending"

// Everything but the landing page (the one route an unauthenticated first-time visitor always
// hits) is lazy-loaded — each becomes its own chunk, fetched as soon as its route matches
// (the layout's <Suspense fallback={<LoadingFill />}> around <Outlet /> covers the wait). Each
// page owns its own nested `children` route config (see e.g. pages/goals/route.tsx) вЂ” this module
// only lazy-loads each section's top-level layout/page element and splices the page's own
// `routes` export in as `children`, keeping AppShell and ProtectedRoute central.
const loadHomePage = () =>
  import("@/pages/home").then((m) => ({ default: m.HomePage }))
const HomePage = lazy(loadHomePage)
const loadUiKitPage = () =>
  import("@/pages/ui-kit").then((m) => ({ default: m.UiKitPage }))
const UiKitPage = lazy(loadUiKitPage)
const loadV1ImportPage = () =>
  import("@/pages/v1-import").then((m) => ({ default: m.V1ImportPage }))
const V1ImportPage = lazy(loadV1ImportPage)
// A different page slice (pages/onslaught) nested under "/my-game" - kept here rather than in
// pages/my-game/route.tsx since FSD forbids one page slice importing another's internals.
const loadOnslaughtPage = () =>
  import("@/pages/onslaught").then((m) => ({ default: m.OnslaughtPage }))
const OnslaughtPage = lazy(loadOnslaughtPage)
// Lazy too: the setup flow pulls in the whole V1 import panel, which only a first-run user needs.
const loadAccountSetupRoute = () =>
  import("./account-setup-route").then((m) => ({
    default: m.AccountSetupRoute,
  }))
const AccountSetupRoute = lazy(loadAccountSetupRoute)
const loadPrivacyPage = () =>
  import("@/pages/privacy").then((m) => ({ default: m.PrivacyPage }))
const PrivacyPage = lazy(loadPrivacyPage)
const loadTermsPage = () =>
  import("@/pages/terms").then((m) => ({ default: m.TermsPage }))
const TermsPage = lazy(loadTermsPage)

// Public for every visitor, signed in or not: no auth guard and no onboarding gate (a user mid-setup
// may still need to read them). Each page's namespace is fetched here, not only by the page, for
// the browser title. Both URLs are also linked from the Entra ID sign-in branding.
function PrivacyRoute() {
  const { t } = useTranslation("privacy")

  return (
    <PublicLayout pageTitle={t("title")}>
      <PrivacyPage />
    </PublicLayout>
  )
}

function TermsRoute() {
  const { t } = useTranslation("terms")

  return (
    <PublicLayout pageTitle={t("title")}>
      <TermsPage />
    </PublicLayout>
  )
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <AuthenticatedRoute>
      <OnboardingGate>{children}</OnboardingGate>
    </AuthenticatedRoute>
  )
}

function NotFoundRedirect() {
  const isAuthenticated = useIsAuthenticated()
  const authPending = useAuthPending()

  if (authPending) {
    return <AuthResolving />
  }

  return <Navigate replace to={isAuthenticated ? "/home" : "/"} />
}

// React Router v8 data-mode route config (consumed by createBrowserRouter in app/index.tsx). Auth guards
// are plain element wrappers; the only loaders are `preloadOnMatch`, which start a lazy page chunk at
// route match so it downloads while `OnboardingGate` waits for `GET /me`. Post-redirect navigation (previously a
// dedicated /auth/callback route) is now owned by the MSAL redirect bridge (apps/web/redirect.html,
// see shared/auth's redirectUri) вЂ” it navigates back to wherever the flow was initiated before the
// SPA even loads, so no in-app callback route is needed.
// The whole tree sits under one pathless route whose `errorElement` is the last line of defence
// (landing, account setup, the shell itself); the AppShell route carries its own so a page failure
// is contained inside the shell. Both reload once on a stale-build failure (see route-error-boundary).
const appRoutes: RouteObject[] = [
  { path: "/", element: <LandingRoute /> },
  {
    path: "/privacy",
    element: <PrivacyRoute />,
    loader: preloadOnMatch(loadPrivacyPage),
  },
  {
    path: "/terms",
    element: <TermsRoute />,
    loader: preloadOnMatch(loadTermsPage),
  },
  // Account setup sits outside AppShell on purpose. A user here has no configured API key, so every
  // shell affordance is a trap or noise — nav links bounce straight back here, the catalog init gate
  // covers the form, and the player-data provider parks a "sync failed" badge on the screen asking
  // for the key it is missing. Each mobile step still gets its own address so Back works, a reload
  // keeps the step, and each step is reported as its own page-view.
  // Authentication only: wrapping these in the onboarding gate would redirect setup to setup.
  {
    element: <AccountSetupLayout />,
    children: accountSetupRoutes.map(({ path, step }) => ({
      path,
      loader: preloadOnMatch(loadAccountSetupRoute),
      element: (
        <AuthenticatedRoute>
          <AccountSetupRoute step={step} />
        </AuthenticatedRoute>
      ),
    })),
  },
  {
    element: <AppShell />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "/home",
        element: (
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        ),
        loader: preloadOnMatch(loadHomePage),
      },
      {
        path: "/account/v1-import",
        element: (
          <ProtectedRoute>
            <V1ImportPage />
          </ProtectedRoute>
        ),
        loader: preloadOnMatch(loadV1ImportPage),
      },
      {
        path: "/dailies",
        element: (
          <ProtectedRoute>
            <DailiesLayout />
          </ProtectedRoute>
        ),
        children: dailiesRoutes,
        loader: preloadDailiesLayout,
      },
      {
        path: "/library",
        element: <LibraryPage />,
        children: libraryRoutes,
        loader: preloadLibraryPage,
      },
      {
        path: "/plan",
        element: (
          <ProtectedRoute>
            <GoalsLayout />
          </ProtectedRoute>
        ),
        children: goalsRoutes,
        loader: preloadGoalsLayout,
      },
      // The only section mixing a public page (Collection) with sign-in-only ones, so the guard
      // sits on each protected child instead of on the layout.
      {
        path: "/my-game",
        element: <MyGameLayout />,
        children: [
          ...myGamePublicRoutes,
          ...[
            ...myGameProtectedRoutes,
            {
              path: "onslaught",
              element: <OnslaughtPage />,
              loader: preloadOnMatch(loadOnslaughtPage),
            },
          ].map((route) => ({
            ...route,
            element: <ProtectedRoute>{route.element}</ProtectedRoute>,
          })),
        ],
        loader: preloadMyGameLayout,
      },
      {
        path: "/legendary-events",
        element: (
          <ProtectedRoute>
            <LegendaryEventsLayout />
          </ProtectedRoute>
        ),
        children: legendaryEventsRoutes,
        loader: preloadLegendaryEventsLayout,
      },
      {
        path: "/guild",
        element: (
          <ProtectedRoute>
            <GuildPage />
          </ProtectedRoute>
        ),
        children: guildRoutes,
        loader: preloadGuildPage,
      },
      // Public component showcase for local/QA use вЂ” never registered in production (see
      // shared/config's isUiKitEnabled), so it 404s (falls through to the "*" redirect below)
      // there regardless of how someone reaches the URL.
      ...(isUiKitEnabled
        ? [
            {
              path: "/ui-kit",
              element: <UiKitPage />,
              loader: preloadOnMatch(loadUiKitPage),
            },
          ]
        : []),
      { path: "*", element: <NotFoundRedirect /> },
    ],
  },
]

export const routes: RouteObject[] = [
  { errorElement: <RouteErrorBoundary />, children: appRoutes },
]
