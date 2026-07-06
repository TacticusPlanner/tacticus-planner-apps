import type { ReactNode } from "react"

import { OnboardingDialog } from "@/features/account-onboarding"
import { useCurrentUser } from "@/entities/account"

/**
 * Blocks protected routes with the onboarding dialog until the signed-in user has a configured Tacticus API
 * key. While the current-user fetch is still loading/idle, or failed, the protected content renders as usual
 * — onboarding only blocks once we've positively confirmed it's incomplete, so a transient `/me` failure
 * doesn't lock a user out of the app.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { state } = useCurrentUser()

  if (state.status === "success" && !state.user.hasCompletedOnboarding) {
    return <OnboardingDialog />
  }

  return <>{children}</>
}
