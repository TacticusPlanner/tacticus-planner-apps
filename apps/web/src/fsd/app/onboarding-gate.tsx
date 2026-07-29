import type { ReactNode } from "react"
import { Spinner } from "@workspace/ui/components/spinner"

import { OnboardingDialog } from "@/features/account-onboarding"
import { useCurrentUser } from "@/entities/account"

/**
 * Blocks protected routes with the onboarding dialog until the signed-in user has a configured Tacticus API
 * key. Protected content waits for the current-user request because GET /api/v1/me provisions a first-time
 * caller's Account/Profile; mounting child routes before it succeeds can race their profile-scoped requests
 * and produce misleading 404 responses. Errors still fail open so a transient failure does not lock the app.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { state } = useCurrentUser()

  if (state.status === "idle" || state.status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    )
  }

  if (state.status === "success" && !state.user.hasCompletedOnboarding) {
    return <OnboardingDialog />
  }

  return <>{children}</>
}
