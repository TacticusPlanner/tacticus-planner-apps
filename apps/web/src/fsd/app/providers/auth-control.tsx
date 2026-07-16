import { useState } from "react"
import {
  LoaderCircle,
  Download,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"
import { toast } from "sonner"

import { AuthError, InteractionStatus } from "@azure/msal-browser"
import { useIsAuthenticated, useMsal } from "@azure/msal-react"

import { ManageAccountDialog } from "@/features/account-management"
import { ImportV1Dialog } from "@/features/v1-import"
import { useCurrentUser } from "@/entities/account"
import { ApiError } from "@/shared/api"
import {
  isInteractionRequired,
  loginRequest,
  requestApiAccess,
} from "@/shared/auth"
import { TourButton, useTourControlledPopoverOpen } from "@/shared/tour"

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

function accountErrorMessageKey(
  error: unknown
):
  | "auth.accountConsentRequired"
  | "auth.accountForbidden"
  | "auth.accountLoadError" {
  if (isInteractionRequired(error)) return "auth.accountConsentRequired"
  if (error instanceof ApiError && error.status === 403) {
    return "auth.accountForbidden"
  }
  return "auth.accountLoadError"
}

export function AuthControl({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const { accounts, inProgress, instance } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const isInteractionInProgress = inProgress !== InteractionStatus.None
  const account = instance.getActiveAccount() ?? accounts[0]
  const { refetch, state: accountState } = useCurrentUser()
  const [isManageAccountOpen, setIsManageAccountOpen] = useState(false)
  const [isV1ImportOpen, setIsV1ImportOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useTourControlledPopoverOpen()

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
      void requestApiAccess().catch((error: unknown) => {
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
        aria-label={compact ? t("auth.signIn") : undefined}
        data-testid="auth-sign-in"
        disabled={isInteractionInProgress}
        onClick={handleSignIn}
        size={compact ? "icon" : "sm"}
        variant="outline"
      >
        <LogIn data-icon={compact ? undefined : "inline-start"} />
        {compact ? null : t("auth.signIn")}
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
      <Popover onOpenChange={setMenuOpen} open={menuOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={t("auth.userMenu")}
            className={cn(
              "flex min-w-0 items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-hidden hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
              compact ? "size-8 justify-center" : "max-w-56 px-1.5 py-1"
            )}
            data-testid="auth-account-trigger"
          >
            <UserRound className="size-4 shrink-0" aria-hidden="true" />
            {compact ? null : (
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
                {isMobile &&
                accountState.status === "success" &&
                accountEmail ? (
                  <div
                    className="truncate text-xs"
                    data-testid="auth-account-email"
                    title={accountEmail}
                  >
                    {accountEmail}
                  </div>
                ) : null}
              </div>
            )}
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
            aria-label={t("goals.v1Import.menu")}
            className="w-full justify-start"
            data-testid="auth-v1-import"
            onClick={() => {
              setIsV1ImportOpen(true)
              setMenuOpen(false)
            }}
            size="sm"
            variant="ghost"
          >
            <Download data-icon="inline-start" />
            {t("goals.v1Import.menu")}
          </Button>
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
          {compact ? null : (
            <span className="truncate text-xs text-destructive">
              {t(accountErrorMessageKey(accountState.error))}
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label={t(
                  isInteractionRequired(accountState.error)
                    ? "auth.grantAccess"
                    : "auth.retry"
                )}
                className="size-6"
                data-testid="auth-account-retry"
                disabled={isInteractionInProgress}
                onClick={handleAccountRecovery}
                size="icon"
                variant="ghost"
              >
                <RefreshCw className="size-3" />
              </Button>
            </TooltipTrigger>
            {compact ? (
              <TooltipContent align="center" side="right">
                {t(accountErrorMessageKey(accountState.error))}
              </TooltipContent>
            ) : null}
          </Tooltip>
        </div>
      ) : null}
      <ManageAccountDialog
        onOpenChange={setIsManageAccountOpen}
        open={isManageAccountOpen}
      />
      <ImportV1Dialog open={isV1ImportOpen} onOpenChange={setIsV1ImportOpen} />
    </div>
  )
}
