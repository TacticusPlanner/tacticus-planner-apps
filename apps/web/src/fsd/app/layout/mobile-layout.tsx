import { Suspense, useState } from "react"
import { Link, Outlet, useLocation } from "react-router"
import { LogIn, Menu, Settings } from "lucide-react"
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
import { TourButton, useTourControlledPopoverOpen } from "@/shared/tour"

import { AuthControl } from "../providers/auth-control"
import { LanguageSwitcher } from "../providers/language-switcher"
import { ThemeSwitcher } from "../providers/theme-switcher"
import { AppLogo } from "./app-logo"
import "./mobile-layout.css"
import type { NavItem } from "./nav-items"
import { ScrollToTopButton } from "./scroll-to-top-button"

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
      <div className="flex-1 pb-(--mobile-nav-height)">
        <Suspense fallback={<LoadingFill />}>
          <Outlet />
        </Suspense>
      </div>
      <ScrollToTopButton />
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
    <header className="sticky top-0 z-40 flex h-(--mobile-header-height) items-center justify-between gap-3 border-b bg-background px-4 pt-[env(safe-area-inset-top)]">
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

function isItemActive(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(path + "/")
}

function MobileBottomNav({ items }: { items: NavItem[] }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const primaryItems = items.filter(
    (item) => item.mobilePlacement === "primary"
  )
  const menuItems = items.filter((item) => item.mobilePlacement === "menu")
  const isMenuItemActive = menuItems.some((item) =>
    isItemActive(pathname, item.path)
  )

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-(--mobile-nav-height) border-t bg-background pb-[env(safe-area-inset-bottom)]"
      data-testid="primary-nav"
    >
      {menuItems.length > 0 ? (
        <Popover onOpenChange={setMenuOpen} open={menuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t("nav.menu")}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
                menuOpen || isMenuItemActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              data-testid="mobile-menu-trigger"
            >
              <Menu className="size-5" />
              <span>{t("nav.menu")}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-48 gap-1 p-1"
            data-testid="mobile-menu"
            side="top"
          >
            {menuItems.map((item) => {
              const isActive = isItemActive(pathname, item.path)
              return (
                <Link
                  key={item.path}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => setMenuOpen(false)}
                  to={item.path}
                >
                  <item.icon className="size-4" />
                  {t(item.labelKey)}
                </Link>
              )
            })}
          </PopoverContent>
        </Popover>
      ) : null}
      {primaryItems.map((item) => {
        const isActive = isItemActive(pathname, item.path)
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
