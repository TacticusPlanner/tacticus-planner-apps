import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useLocation } from "react-router"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { useMsal } from "@azure/msal-react"

import { useCurrentUser } from "@/entities/account"
import { signOut, useActiveAccountId } from "@/shared/auth"

/**
 * Blocks protected routes until the signed-in user has a configured Tacticus API key, sending them to
 * `/setup` and remembering where they were headed. Protected content waits for the current-user request
 * because GET /api/v1/me provisions a first-time caller's Account/Profile; mounting child routes before it
 * succeeds can race their profile-scoped requests and produce misleading 404 responses.
 *
 * Only a definitive answer redirects. The loading branch renders a spinner, and the error branch blocks
 * with a retry — neither navigates, because `/setup` sends configured users back here and two guards
 * acting on an indeterminate state would bounce the user between them. Blocking (rather than failing
 * open) on error matters because an indeterminate state must not be read as "onboarding complete": that
 * would let an unconfigured account reach protected content during a transient outage.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { instance } = useMsal()
  const accountId = useActiveAccountId()
  const { state, refetch } = useCurrentUser()
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

  if (state.status === "error") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-lg border bg-card p-8 text-center shadow-lg">
          <h2 className="text-lg font-semibold">
            {t("accountGate.errorTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("accountGate.errorDescription")}
          </p>
          <div className="flex gap-2">
            <Button data-testid="account-gate-retry" onClick={refetch}>
              {t("accountGate.retry")}
            </Button>
            <Button
              data-testid="account-gate-sign-out"
              disabled={!accountId}
              onClick={() => {
                if (accountId) {
                  void signOut(instance, accountId).catch((error: unknown) => {
                    console.error("[MSAL] sign-out failed", error)
                  })
                }
              }}
              variant="outline"
            >
              {t("auth.signOut")}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
