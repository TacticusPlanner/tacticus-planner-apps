import { Suspense } from "react"
import { Link, Outlet, useLocation } from "react-router"
import { LogIn, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { useMsal } from "@azure/msal-react"

import { loginRequest } from "@/shared/auth"

import { AuthControl } from "../providers/auth-control"
import { LanguageSwitcher } from "../providers/language-switcher"
import { ThemeSwitcher } from "../providers/theme-switcher"
import { TourButton } from "../providers/tour-button"
import { AppLogo } from "./app-logo"
import type { NavItem } from "./nav-items"

function LoadingFill() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner className="size-8 text-primary" />
    </div>
  )
}

export function MobileShell({
  isAuthenticated,
  visibleItems,
  pageTitle,
}: {
  isAuthenticated: boolean
  visibleItems: NavItem[]
  pageTitle: string | undefined
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <MobileHeader isAuthenticated={isAuthenticated} pageTitle={pageTitle} />
      <div className="flex-1 pb-16">
        <Suspense fallback={<LoadingFill />}>
          <Outlet />
        </Suspense>
      </div>
      <MobileBottomNav items={visibleItems} />
    </div>
  )
}

function MobileHeader({
  isAuthenticated,
  pageTitle,
}: {
  isAuthenticated: boolean
  pageTitle: string | undefined
}) {
  const { t } = useTranslation()
  const { instance } = useMsal()

  const handleSignIn = () => {
    void instance.loginRedirect(loginRequest)
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b bg-background px-4 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <AppLogo className="size-7 shrink-0" />
        <span className="truncate text-sm font-semibold tracking-tight">
          {pageTitle ?? t("app.name")}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!isAuthenticated ? (
          <>
            <Button size="sm" onClick={handleSignIn}>
              <LogIn />
              {t("auth.signIn")}
            </Button>
            <MobileGuestSettings />
          </>
        ) : (
          <AuthControl />
        )}
      </div>
    </header>
  )
}

// Signed-out mobile users have no user-profile menu to host the theme/language switchers, so they
// get their own compact popover instead — keeps the header from needing two full-width controls.
function MobileGuestSettings() {
  const { t } = useTranslation()

  return (
    <Popover>
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
      <PopoverContent align="end" className="w-56 gap-2">
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

function MobileBottomNav({ items }: { items: NavItem[] }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-40 flex h-16 border-t bg-background">
      {items.map((item) => {
        const isActive =
          pathname === item.path || pathname.startsWith(item.path + "/")
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="size-5" />
            <span>{t(item.labelKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
