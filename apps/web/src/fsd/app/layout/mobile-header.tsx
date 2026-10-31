import { LogIn, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { useMsal } from "@azure/msal-react"

import { GuestPreferencesCard } from "@/widgets/account-menu"
import { loginRequest, useSilentSignInStatus } from "@/shared/auth"
import {
  PageTourButton,
  TourButton,
  useTourControlledPopoverOpen,
} from "@/shared/tour"

import { AuthControl } from "../providers/auth-control"
import { useUserJot } from "../providers/userjot-provider"
import { AppLogo, AppLogoHomeLink, BetaBadge } from "./app-logo"
import type { NavItem } from "./nav-items"
import { SectionTabs } from "./section-tabs"
import { PAGE_HEADING_ID } from "./use-focus-page-heading"

export function MobileHeader({
  activeSection,
  isAuthenticated,
  pageDescription,
  pageTitle,
}: {
  activeSection: NavItem | undefined
  isAuthenticated: boolean
  pageDescription: string | undefined
  pageTitle: string | undefined
}) {
  const { t } = useTranslation()
  const { instance } = useMsal()
  const isCheckingSilentSignIn = useSilentSignInStatus() === "checking"
  const signInLabel = isCheckingSilentSignIn
    ? t("auth.checkingSignIn")
    : t("auth.signIn")

  const handleSignIn = () => {
    void instance.loginRedirect(loginRequest)
  }

  return (
    <header
      className="sticky top-0 z-40 border-b bg-topbar pt-[env(safe-area-inset-top)]"
      data-testid="mobile-header"
    >
      <div className="flex h-20 items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <AppLogoHomeLink
            className="relative shrink-0 rounded-md outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            isAuthenticated={isAuthenticated}
          >
            <AppLogo className="size-10" />
            <BetaBadge className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1 bg-background" />
          </AppLogoHomeLink>
          <div className="flex min-w-0 flex-col">
            <h1
              className="truncate text-xl font-semibold tracking-tight outline-hidden"
              id={PAGE_HEADING_ID}
              tabIndex={-1}
            >
              {pageTitle ?? t("app.name")}
            </h1>
            {pageTitle && pageDescription ? (
              <span className="truncate text-xs text-muted-foreground">
                {pageDescription}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {/* Renders only on a page that registered its own tour - the app-wide navigation tour
              lives on the "Show me around" button inside the account menu. */}
          <PageTourButton iconOnly />
          {!isAuthenticated ? (
            <>
              <Button size="sm" onClick={handleSignIn}>
                <LogIn />
                {signInLabel}
              </Button>
              <MobileGuestSettings />
            </>
          ) : (
            <AuthControl />
          )}
        </div>
      </div>
      {activeSection?.children?.length ? (
        <div className="border-t px-4 py-1.5">
          <SectionTabs item={activeSection} />
        </div>
      ) : null}
    </header>
  )
}

function MobileGuestSettings() {
  const { t } = useTranslation()
  const [open, setOpen] = useTourControlledPopoverOpen()
  const { open: openUserJot, status: feedbackStatus } = useUserJot()

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          aria-label={t("settings.label")}
          data-testid="mobile-guest-settings"
          size="icon"
          variant="outline"
        >
          <Settings />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 gap-2"
        data-testid="mobile-guest-settings-content"
      >
        <GuestPreferencesCard
          changelogUnavailable={
            feedbackStatus === "failed"
              ? t("nav.quickActions.feedbackUnavailable")
              : undefined
          }
          onChangelog={() => {
            setOpen(false)
            openUserJot({ to: "updates" })
          }}
          tourRow={
            <TourButton
              className="h-8 w-full justify-start px-2 font-normal"
              variant="ghost"
            />
          }
        />
      </PopoverContent>
    </Popover>
  )
}
