import { LogIn, Compass, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { useMsal } from "@azure/msal-react"

import { loginRequest, useSilentSignInStatus } from "@/shared/auth"
import {
  TourButton,
  useTour,
  useTourControlledPopoverOpen,
} from "@/shared/tour"

import { AuthControl } from "../providers/auth-control"
import { LanguageSwitcher } from "../providers/language-switcher"
import { ThemeSwitcher } from "../providers/theme-switcher"
import { AppLogo } from "./app-logo"
import type { NavItem } from "./nav-items"
import { SectionTabs } from "./section-tabs"

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
  const { isRunning, startTour } = useTour()
  const isCheckingSilentSignIn = useSilentSignInStatus() === "checking"
  const signInLabel = isCheckingSilentSignIn
    ? t("auth.checkingSignIn")
    : t("auth.signIn")

  const handleSignIn = () => {
    void instance.loginRedirect(loginRequest)
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-sidebar pt-[env(safe-area-inset-top)]">
      <div className="flex h-20 items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <AppLogo className="size-10 shrink-0" />
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-xl font-semibold tracking-tight">
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
          {!isAuthenticated ? (
            <>
              <Button size="sm" onClick={handleSignIn}>
                <LogIn />
                {signInLabel}
              </Button>
              <MobileGuestSettings />
            </>
          ) : (
            <>
              <Button
                aria-label={t("tour.start")}
                className="size-10 rounded-full"
                data-testid="mobile-tour-button"
                disabled={isRunning}
                onClick={startTour}
                size="icon"
                variant="ghost"
              >
                <Compass />
              </Button>
              <AuthControl />
            </>
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
        className="w-56 gap-2"
        data-testid="mobile-guest-settings-content"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm">{t("theme.label")}</span>
          <ThemeSwitcher />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm">{t("language.label")}</span>
          <LanguageSwitcher />
        </div>
        <TourButton />
      </PopoverContent>
    </Popover>
  )
}
