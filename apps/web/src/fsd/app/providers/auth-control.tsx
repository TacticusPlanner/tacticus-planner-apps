import { LogIn, LogOut, UserRound } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { toast } from "sonner"

import { AuthError, InteractionStatus } from "@azure/msal-browser"
import { useIsAuthenticated, useMsal } from "@azure/msal-react"

import { loginRequest } from "@/shared/auth"

type AuthOperation = "sign-in" | "sign-out"

function logAuthenticationError(operation: AuthOperation, error: unknown) {
  const message = `[MSAL] ${operation} failed`

  if (error instanceof AuthError) {
    console.error(message, {
      correlationId: error.correlationId || undefined,
      errorCode: error.errorCode,
      message: error.message,
      name: error.name,
      stack: error.stack,
      subError: error.subError || undefined,
    })
    return
  }

  if (error instanceof Error) {
    console.error(message, {
      message: error.message,
      name: error.name,
      stack: error.stack,
    })
    return
  }

  console.error(message, { value: String(error) })
}

export function AuthControl() {
  const { t } = useTranslation()
  const { accounts, inProgress, instance } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const isInteractionInProgress = inProgress !== InteractionStatus.None
  const account = instance.getActiveAccount() ?? accounts[0]

  const handleSignIn = () => {
    void instance.loginRedirect(loginRequest).catch((error: unknown) => {
      logAuthenticationError("sign-in", error)
      toast.error(t("auth.error"))
    })
  }

  const handleSignOut = () => {
    void instance.logoutRedirect({ account }).catch((error: unknown) => {
      logAuthenticationError("sign-out", error)
      toast.error(t("auth.error"))
    })
  }

  if (!isAuthenticated || !account) {
    return (
      <Button
        data-testid="auth-sign-in"
        disabled={isInteractionInProgress}
        onClick={handleSignIn}
        size="sm"
        variant="outline"
      >
        <LogIn data-icon="inline-start" />
        {t("auth.signIn")}
      </Button>
    )
  }

  const accountName = account.name ?? account.username ?? t("auth.account")

  return (
    <div className="flex items-center gap-2" data-testid="auth-account">
      <span
        className="flex max-w-48 items-center gap-1.5 truncate text-sm text-muted-foreground"
        data-testid="auth-account-name"
        title={accountName}
      >
        <UserRound className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{accountName}</span>
      </span>
      <Button
        aria-label={t("auth.signOut")}
        data-testid="auth-sign-out"
        disabled={isInteractionInProgress}
        onClick={handleSignOut}
        size="sm"
        variant="outline"
      >
        <LogOut data-icon="inline-start" />
        {t("auth.signOut")}
      </Button>
    </div>
  )
}
