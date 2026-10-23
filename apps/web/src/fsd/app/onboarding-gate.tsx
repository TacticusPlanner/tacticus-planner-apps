import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Navigate, useLocation } from "react-router"
import { Button } from "@workspace/ui/components/button"
import { Spinner } from "@workspace/ui/components/spinner"
import { useMsal } from "@azure/msal-react"

import { isAccountSetupComplete, useCurrentUser } from "@/entities/account"
import {
  signOut,
  useActiveAccountId,
  useRequestApiAccessOnce,
} from "@/shared/auth"

import { SETUP_STEP_PATHS } from "./account-setup-routes"
import { useDelayedFlag } from "./use-delayed-flag"

// A healthy /account answers in well under a second; past this, say so rather than look frozen.
export const ACCOUNT_GATE_SLOW_MS = 5000

function logApiAccessError(error: unknown) {
  console.error("[MSAL] api-access failed", error)
}

/**
 * Blocks protected routes until the signed-in user has a configured Tacticus API key and a confirmed
 * display name, sending them to `/setup` (or straight to its name step) and remembering where they were headed. Protected content waits for the current-user request
 * because GET /api/v1/account provisions a first-time caller's Account/Profile; mounting child routes before it
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
  // An expired/revoked session is not an outage: start the in-app re-authentication redirect
  // (which returns to this URL) and keep the spinner up instead of offering Retry / Sign out.
  const reauthenticating = useRequestApiAccessOnce(
    state.status === "error" ? state.error : undefined,
    logApiAccessError
  )

  const waiting =
    state.status === "idle" || state.status === "loading" || reauthenticating
  const slow = useDelayedFlag(
    waiting && !reauthenticating,
    ACCOUNT_GATE_SLOW_MS
  )

  if (waiting) {
    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <div
          aria-live="polite"
          className="flex max-w-sm flex-col items-center gap-3 text-center"
          data-testid="account-gate-loading"
          role="status"
        >
          <Spinner aria-hidden="true" className="size-8 text-primary" />
          <p className="text-sm font-medium">
            {reauthenticating
              ? t("accountGate.reauthenticating")
              : t("accountGate.loading")}
          </p>
          {slow ? (
            <p
              className="text-sm text-muted-foreground"
              data-testid="account-gate-slow"
            >
              {t("accountGate.slow")}
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  if (state.status === "success" && !isAccountSetupComplete(state.user)) {
    const next = `${location.pathname}${location.search}`
    // A user who already has a key only owes the name step; anyone else starts from the beginning.
    const setupPath = state.user.hasCompletedOnboarding
      ? SETUP_STEP_PATHS.name
      : SETUP_STEP_PATHS.choose
    return (
      <Navigate replace to={`${setupPath}?next=${encodeURIComponent(next)}`} />
    )
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
            <Button
              // eslint-disable-next-line jsx-a11y/no-autofocus -- the error screen replaces the whole app, so focus would otherwise drop to body.
              autoFocus
              data-testid="account-gate-retry"
              onClick={refetch}
            >
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
              variant="ghost"
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
