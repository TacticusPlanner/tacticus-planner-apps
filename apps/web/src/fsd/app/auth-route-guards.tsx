import type { ReactNode } from "react"
import { Navigate, useLocation, useSearchParams } from "react-router"
import { Spinner } from "@workspace/ui/components/spinner"

import { InteractionStatus } from "@azure/msal-browser"
import { useIsAuthenticated, useMsal } from "@azure/msal-react"

import { LandingPage } from "@/pages/landing"

import { resolveNextPath } from "./resolve-next-path"

// msal-react's MsalProvider always mounts with `accounts: []`/`inProgress: Startup`, even when the
// underlying instance already restored an active account before the app rendered (see
// shared/auth's initializeAuthentication) — it only picks up the real state a tick later, inside its
// own effect. Every route guard below must wait for `inProgress` to clear before trusting
// `isAuthenticated`; deciding on the stale first-render value is what caused a hard refresh on a
// protected deep link (e.g. /guild/members) to bounce to "/" before MSAL had a chance to catch up.
export function AuthResolving() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner className="size-8 text-primary" />
    </div>
  )
}

// Authentication only. Split out of ProtectedRoute so the setup routes can require a signed-in user
// without also being wrapped in the onboarding gate — which would send them to setup from setup.
export function AuthenticatedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useIsAuthenticated()
  const { inProgress } = useMsal()
  const location = useLocation()

  if (inProgress !== InteractionStatus.None) {
    return <AuthResolving />
  }

  if (!isAuthenticated) {
    // Carried as a query param on "/" (not just discarded) because MSAL's navigateToLoginRequestUrl
    // restores whatever URL is in the address bar at the moment loginRedirect() is actually called —
    // which happens later, from LandingPage, after this redirect has already replaced the URL.
    // Without this, the current destination (e.g. a deep-linked /setup/key?next=... or any other
    // protected route visited while signed out) would be lost across the sign-in round trip.
    const next = `${location.pathname}${location.search}`
    return <Navigate replace to={`/?next=${encodeURIComponent(next)}`} />
  }

  return <>{children}</>
}

export function LandingRoute() {
  const isAuthenticated = useIsAuthenticated()
  const { inProgress } = useMsal()
  const [searchParams] = useSearchParams()

  if (inProgress !== InteractionStatus.None) {
    return <AuthResolving />
  }

  if (isAuthenticated) {
    // `next` is the destination AuthenticatedRoute preserved before sending an unauthenticated
    // visitor here to sign in; allowSetupDestination because landing back on a deep-linked
    // /setup/* address is exactly the point here, unlike the onboarding gate's own use of `next`.
    const destination = resolveNextPath(searchParams.get("next"), {
      allowSetupDestination: true,
    })
    return <Navigate replace to={destination} />
  }

  return <LandingPage />
}
