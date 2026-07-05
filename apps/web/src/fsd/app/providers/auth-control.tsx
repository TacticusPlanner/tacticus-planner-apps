import { useState } from "react"
import {
  LoaderCircle,
  LogIn,
  LogOut,
  RefreshCw,
  Settings,
  UserRound,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Separator } from "@workspace/ui/components/separator"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { toast } from "sonner"

import { AuthError, InteractionStatus } from "@azure/msal-browser"
import { useIsAuthenticated, useMsal } from "@azure/msal-react"

import { ManageAccountDialog } from "@/features/account-management"
import { useCurrentUser } from "@/entities/account"
import { ApiError } from "@/shared/api"
import {
  isInteractionRequired,
  loginRequest,
  requestApiAccess,
} from "@/shared/auth"
import { TourButton } from "@/shared/tour"

import { LanguageSwitcher } from "./language-switcher"
import { ThemeSwitcher } from "./theme-switcher"

type AuthOperation = "api-access" | "sign-in" | "sign-out"

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
  const isMobile = useIsMobile()
  const { accounts, inProgress, instance } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const isInteractionInProgress = inProgress !== InteractionStatus.None
  const account = instance.getActiveAccount() ?? accounts[0]
  const { refetch, state: accountState } = useCurrentUser()
  const [isManageAccountOpen, setIsManageAccountOpen] = useState(false)

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

  const handleAccountRecovery = () => {
    if (
      accountState.status === "error" &&
      isInteractionRequired(accountState.error)
    ) {
      void requestApiAccess(instance, account!).catch((error: unknown) => {
        logAuthenticationError("api-access", error)
        toast.error(t("auth.error"))
      })
      return
    }

    refetch()
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

  const currentUser =
    accountState.status === "success" ? accountState.user : null
  const accountName =
    currentUser?.displayName ??
    account.name ??
    account.username ??
    t("auth.account")
  const accountEmail = account.username

  return (
    <div className="flex items-center gap-1" data-testid="auth-account">
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={t("auth.userMenu")}
            className="flex max-w-56 min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-muted-foreground outline-hidden hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
            data-testid="auth-account-trigger"
          >
            <UserRound className="size-4 shrink-0" aria-hidden="true" />
            <div
              className="min-w-0 text-left leading-tight"
              data-testid="auth-account-panel"
            >
              <div
                className="truncate"
                data-testid="auth-account-name"
                title={accountName}
              >
                {accountName}
              </div>
              {accountState.status === "loading" ? (
                <div
                  className="flex items-center gap-1 text-xs"
                  data-testid="auth-account-loading"
                >
                  <LoaderCircle
                    className="size-3 animate-spin"
                    aria-hidden="true"
                  />
                  {t("auth.accountLoading")}
                </div>
              ) : null}
              {isMobile && accountState.status === "success" && accountEmail ? (
                <div
                  className="truncate text-xs"
                  data-testid="auth-account-email"
                  title={accountEmail}
                >
                  {accountEmail}
                </div>
              ) : null}
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 gap-2">
          {isMobile ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">{t("theme.label")}</span>
                <ThemeSwitcher />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm">{t("language.label")}</span>
                <LanguageSwitcher />
              </div>
              <TourButton />
              <Separator />
            </>
          ) : null}
          <Button
            aria-label={t("auth.manageAccount")}
            className="w-full justify-start"
            data-testid="auth-manage-account"
            onClick={() => setIsManageAccountOpen(true)}
            size="sm"
            variant="ghost"
          >
            <Settings data-icon="inline-start" />
            {t("auth.manageAccount")}
          </Button>
          <Button
            aria-label={t("auth.signOut")}
            className="w-full justify-start"
            data-testid="auth-sign-out"
            disabled={isInteractionInProgress}
            onClick={handleSignOut}
            size="sm"
            variant="ghost"
          >
            <LogOut data-icon="inline-start" />
            {t("auth.signOut")}
          </Button>
        </PopoverContent>
      </Popover>
      {accountState.status === "error" ? (
        <div
          className="flex items-center gap-1"
          data-testid="auth-account-error"
        >
          <span className="truncate text-xs text-destructive">
            {isInteractionRequired(accountState.error)
              ? t("auth.accountConsentRequired")
              : accountState.error instanceof ApiError &&
                  accountState.error.status === 403
                ? t("auth.accountForbidden")
                : t("auth.accountLoadError")}
          </span>
          <Button
            aria-label={
              isInteractionRequired(accountState.error)
                ? t("auth.grantAccess")
                : t("auth.retry")
            }
            className="size-6"
            data-testid="auth-account-retry"
            disabled={isInteractionInProgress}
            onClick={handleAccountRecovery}
            size="icon"
            variant="ghost"
          >
            <RefreshCw className="size-3" />
          </Button>
        </div>
      ) : null}
      <ManageAccountDialog
        onOpenChange={setIsManageAccountOpen}
        open={isManageAccountOpen}
      />
    </div>
  )
}
