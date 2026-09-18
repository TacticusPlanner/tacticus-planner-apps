import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router"
import { Spinner } from "@workspace/ui/components/spinner"

import { useCurrentUser } from "@/entities/account"

/**
 * Blocks protected routes until the signed-in user has a configured Tacticus API key, sending them to
 * `/setup` and remembering where they were headed. Protected content waits for the current-user request
 * because GET /api/v1/me provisions a first-time caller's Account/Profile; mounting child routes before it
 * succeeds can race their profile-scoped requests and produce misleading 404 responses.
 *
 * Only a definitive answer redirects. The loading branch renders a spinner and the error branch fails open
 * by rendering children — neither navigates, because `/setup` sends configured users back here and two
 * guards acting on an indeterminate state would bounce the user between them.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { state } = useCurrentUser()
  const location = useLocation()

  if (state.status === "idle" || state.status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (state.status === "success" && !state.user.hasCompletedOnboarding) {
    const next = `${location.pathname}${location.search}`
    return <Navigate replace to={`/setup?next=${encodeURIComponent(next)}`} />
  }

  return <>{children}</>
}
