import { useEffect, useRef, useState, type ReactNode } from "react"
import { useNavigate } from "react-router"
import { LoaderCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"
import {
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { toast } from "sonner"

import { AuthError, InteractionStatus } from "@azure/msal-browser"
import { useIsAuthenticated, useMsal } from "@azure/msal-react"

import {
  ManageAccountDialog,
  type ManageAccountTab,
} from "@/features/account-management"
import { useCurrentUser } from "@/entities/account"
import {
  isInteractionRequired,
  loginRequest,
  requestApiAccess,
  signOut,
  useSilentSignInStatus,
} from "@/shared/auth"
import { TourButton, useTourControlledPopoverOpen } from "@/shared/tour"

import { AccountAvatar } from "./account-avatar"
import { AccountCard } from "./account-card"
import { GuestAccountMenu } from "./guest-account-menu"
import { useUserJot } from "./userjot-provider"

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
  const { state: accountState } = useCurrentUser()
  const { open: openUserJot } = useUserJot()
  const navigate = useNavigate()
  const [isManageAccountOpen, setIsManageAccountOpen] = useState(false)
  const [manageAccountTab, setManageAccountTab] =
    useState<ManageAccountTab>("integration")
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
      <GuestAccountMenu
        checkingSignIn={isCheckingSilentSignIn}
        disabled={isInteractionInProgress}
        onOpenChange={setMenuOpen}
        onSignIn={handleSignIn}
        open={menuOpen}
      />
    )
  }

  const currentUser =
    accountState.status === "success" ? accountState.user : null
  // Only the confirmed name is public identity: the provider's name/username can be email-like, so
  // it is never a fallback here.
  const accountName = currentUser?.displayName ?? t("auth.account")
  const accountEmail = account.username
  const applicationAccountId = currentUser?.applicationUserId ?? null

  const dialogs = (
    <ManageAccountDialog
      initialTab={manageAccountTab}
      onOpenChange={setIsManageAccountOpen}
      open={isManageAccountOpen}
    />
  )

  const openManageAccount = (tab: ManageAccountTab) => {
    setManageAccountTab(tab)
    setIsManageAccountOpen(true)
    setMenuOpen(false)
  }

  const goToV1Import = () => {
    setMenuOpen(false)
    void navigate("/account/v1-import")
  }

  const accountCard = (tourRow?: ReactNode) => (
    <AccountCard
      accountEmail={accountEmail}
      accountName={accountName}
      applicationAccountId={applicationAccountId}
      canEditName={currentUser !== null}
      className={tourRow ? "[&_[data-slot=menu-row]]:min-h-11" : undefined}
      onEditName={() => openManageAccount("profile")}
      onFeedback={() => {
        setMenuOpen(false)
        openUserJot()
      }}
      onImportV1={goToV1Import}
      onOpenAccountSettings={() => openManageAccount("integration")}
      onRoadmap={() => setMenuOpen(false)}
      onSignOut={handleSignOut}
      signOutDisabled={isInteractionInProgress}
      tourRow={tourRow}
    />
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
            <DrawerTitle className="sr-only">{accountName}</DrawerTitle>
            <DrawerDescription className="sr-only">
              {accountEmail}
            </DrawerDescription>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {accountCard(
                <TourButton
                  className="h-8 w-full justify-start px-2 font-normal"
                  onStarted={() => setMenuOpen(false)}
                  variant="ghost"
                />
              )}
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
            className="flex max-w-56 min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm text-muted-foreground outline-hidden hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
            data-testid="auth-account-trigger"
          >
            <AccountAvatar
              applicationAccountId={applicationAccountId}
              className="size-6 shrink-0 text-xs"
              displayName={accountName}
            />
            <div
              className="hidden min-w-0 text-left leading-tight lg:block"
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
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-72 gap-2"
          collisionPadding={8}
          side="bottom"
        >
          <PopoverArrow />
          {accountCard()}
        </PopoverContent>
      </Popover>
      {dialogs}
    </div>
  )
}
