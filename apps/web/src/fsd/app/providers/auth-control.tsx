import { useEffect, useRef, useState } from "react"
import { LoaderCircle, Download, LogIn, LogOut, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Separator } from "@workspace/ui/components/separator"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"
import { toast } from "sonner"

import { AuthError, InteractionStatus } from "@azure/msal-browser"
import { useIsAuthenticated, useMsal } from "@azure/msal-react"

import { ManageAccountDialog } from "@/features/account-management"
import { ImportV1Dialog } from "@/features/v1-import"
import { useCurrentUser } from "@/entities/account"
import {
  isInteractionRequired,
  loginRequest,
  requestApiAccess,
  signOut,
  useSilentSignInStatus,
} from "@/shared/auth"
import { TourButton, useTourControlledPopoverOpen } from "@/shared/tour"

import { LanguageSwitcher } from "./language-switcher"
import { ThemeSwitcher } from "./theme-switcher"
import { AccountAvatar } from "./account-avatar"

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

export function AuthControl({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const { accounts, inProgress, instance } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const isInteractionInProgress = inProgress !== InteractionStatus.None
  const account = instance.getActiveAccount() ?? accounts[0]
  const { state: accountState } = useCurrentUser()
  const [isManageAccountOpen, setIsManageAccountOpen] = useState(false)
  const [isV1ImportOpen, setIsV1ImportOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useTourControlledPopoverOpen()
  const hasRequestedApiAccess = useRef(false)
  const silentSignInStatus = useSilentSignInStatus()
  const isCheckingSilentSignIn = silentSignInStatus === "checking"

  const handleSignIn = () => {
    void instance.loginRedirect(loginRequest).catch((error: unknown) => {
      logAuthenticationError("sign-in", error)
      toast.error(t("auth.error"))
    })
  }

  const handleSignOut = () => {
    void signOut(instance, account.homeAccountId).catch((error: unknown) => {
      logAuthenticationError("sign-out", error)
      toast.error(t("auth.error"))
    })
  }

  useEffect(() => {
    if (
      accountState.status === "error" &&
      isInteractionRequired(accountState.error)
    ) {
      if (!hasRequestedApiAccess.current) {
        hasRequestedApiAccess.current = true
        void requestApiAccess().catch((error: unknown) => {
          logAuthenticationError("api-access", error)
          toast.error(t("auth.error"))
        })
      }
      return
    }

    hasRequestedApiAccess.current = false
  }, [accountState, t])

  if (!isAuthenticated || !account) {
    return (
      <Button
        aria-label={
          compact
            ? isCheckingSilentSignIn
              ? t("auth.checkingSignIn")
              : t("auth.signIn")
            : undefined
        }
        data-testid="auth-sign-in"
        disabled={isInteractionInProgress}
        onClick={handleSignIn}
        size={compact ? "icon" : "sm"}
        variant="outline"
      >
        <LogIn data-icon={compact ? undefined : "inline-start"} />
        {compact
          ? null
          : isCheckingSilentSignIn
            ? t("auth.checkingSignIn")
            : t("auth.signIn")}
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
  const applicationAccountId = currentUser?.applicationUserId ?? null

  const dialogs = (
    <>
      <ManageAccountDialog
        onOpenChange={setIsManageAccountOpen}
        open={isManageAccountOpen}
      />
      <ImportV1Dialog open={isV1ImportOpen} onOpenChange={setIsV1ImportOpen} />
    </>
  )

  if (isMobile) {
    return (
      <div className="flex items-center" data-testid="auth-account">
        <Drawer direction="bottom" onOpenChange={setMenuOpen} open={menuOpen}>
          <DrawerTrigger asChild>
            <button
              type="button"
              aria-label={t("auth.userMenu")}
              className="rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              data-testid="auth-account-trigger"
            >
              <AccountAvatar
                applicationAccountId={applicationAccountId}
                className="size-10"
                displayName={accountName}
              />
            </button>
          </DrawerTrigger>
          <DrawerContent
            className="h-dvh max-h-dvh p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] before:inset-0 before:rounded-none"
            data-testid="auth-account-drawer"
          >
            <DrawerHeader className="border-b px-6 py-5 text-left">
              <DrawerTitle className="text-xl">{accountName}</DrawerTitle>
              <DrawerDescription className="break-all">
                {accountEmail}
              </DrawerDescription>
            </DrawerHeader>
            <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-5">
              <div className="space-y-2">
                <span className="text-sm font-medium">{t("theme.label")}</span>
                <ThemeSwitcher className="w-full" />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">
                  {t("language.label")}
                </span>
                <LanguageSwitcher className="w-full" />
              </div>
              <TourButton
                className="w-full justify-start"
                onStarted={() => setMenuOpen(false)}
              />
              <Separator />
              <Button
                className="w-full justify-start"
                data-testid="auth-v1-import"
                onClick={() => {
                  setIsV1ImportOpen(true)
                  setMenuOpen(false)
                }}
                variant="outline"
              >
                <Download data-icon="inline-start" />
                {t("goals.v1Import.menu")}
              </Button>
              <Button
                className="w-full justify-start"
                data-testid="auth-manage-account"
                onClick={() => {
                  setIsManageAccountOpen(true)
                  setMenuOpen(false)
                }}
                variant="outline"
              >
                <Settings data-icon="inline-start" />
                {t("auth.manageAccount")}
              </Button>
              <Button
                className="w-full justify-start"
                data-testid="auth-sign-out"
                disabled={isInteractionInProgress}
                onClick={handleSignOut}
                variant="outline"
              >
                <LogOut data-icon="inline-start" />
                {t("auth.signOut")}
              </Button>
            </div>
            <DrawerFooter className="border-t px-6 py-4">
              <DrawerClose asChild>
                <Button className="w-full" variant="secondary">
                  {t("common.close")}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        {dialogs}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1" data-testid="auth-account">
      <Popover onOpenChange={setMenuOpen} open={menuOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={t("auth.userMenu")}
            className={cn(
              "flex min-w-0 items-center gap-1.5 rounded-md text-sm text-muted-foreground outline-hidden hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
              compact ? "size-8 justify-center" : "max-w-56 px-1.5 py-1"
            )}
            data-testid="auth-account-trigger"
          >
            <AccountAvatar
              applicationAccountId={applicationAccountId}
              className="size-6 shrink-0 text-xs"
              displayName={accountName}
            />
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
              </div>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 gap-3" side="top">
          <PopoverArrow />
          <div
            className="flex items-center gap-3"
            data-testid="auth-account-identity"
          >
            <AccountAvatar
              applicationAccountId={applicationAccountId}
              className="size-10 shrink-0 text-base"
              displayName={accountName}
            />
            <div className="min-w-0 text-left leading-tight">
              <div className="truncate font-medium" title={accountName}>
                {accountName}
              </div>
              <div
                className="truncate text-xs text-muted-foreground"
                title={accountEmail}
              >
                {accountEmail}
              </div>
            </div>
          </div>
          <Separator />
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
          <Separator />
          <Button
            aria-label={t("auth.signOut")}
            className="w-full justify-start text-destructive hover:text-destructive"
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
      {dialogs}
    </div>
  )
}
