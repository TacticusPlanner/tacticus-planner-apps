import { Suspense, useState } from "react"
import { Link, Outlet, useLocation } from "react-router"
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  Compass,
  LogIn,
  Menu,
  PlusCircle,
  RefreshCw,
  Settings,
} from "lucide-react"
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
import { Input } from "@workspace/ui/components/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { useMsal } from "@azure/msal-react"

import { loginRequest } from "@/shared/auth"
import {
  TourButton,
  useTour,
  useTourControlledPopoverOpen,
} from "@/shared/tour"

import { AuthControl } from "../providers/auth-control"
import { LanguageSwitcher } from "../providers/language-switcher"
import { usePlayerDataSyncStatus } from "../providers/player-data-sync-button"
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
  onCreateGoal,
}: {
  isAuthenticated: boolean
  visibleItems: NavItem[]
  pageTitle: string | undefined
  onCreateGoal: () => void
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
      <MobileBottomNav items={visibleItems} onCreateGoal={onCreateGoal} />
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
  const { isRunning, startTour } = useTour()

  const handleSignIn = () => {
    void instance.loginRedirect(loginRequest)
  }

  return (
    <header className="sticky top-0 z-40 flex h-(--mobile-header-height) items-center justify-between gap-3 border-b bg-sidebar px-4 pt-[env(safe-area-inset-top)]">
      <div className="flex min-w-0 items-center gap-3">
        <AppLogo className="size-10 shrink-0" />
        <span className="truncate text-xl font-semibold tracking-tight">
          {pageTitle ?? t("app.name")}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!isAuthenticated ? (
          <>
            <Button size="sm" onClick={handleSignIn}>
              <LogIn />
              {t("auth.signIn")}
            </Button>
            <MobileGuestSettings />
          </>
        ) : (
          <>
            <Button
              aria-label={t("tour.start")}
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

function MobileNavActions({ onCreateGoal }: { onCreateGoal: () => void }) {
  const { t } = useTranslation()
  const { errorText, isSyncing, requiresReauth, status, statusText, syncNow } =
    usePlayerDataSyncStatus()
  const syncPresentation = {
    idle: {
      Icon: CircleDashed,
      className: "bg-muted text-muted-foreground",
    },
    syncing: {
      Icon: RefreshCw,
      className: "bg-accent text-accent-foreground",
    },
    ready: {
      Icon: CheckCircle2,
      className: "bg-accent text-accent-foreground",
    },
    stale: {
      Icon: Clock,
      className: "bg-accent text-accent-foreground",
    },
    error: {
      Icon: requiresReauth ? LogIn : AlertTriangle,
      className: "bg-destructive text-destructive-foreground",
    },
  }[status]
  const syncLabel = `${t("nav.syncWithTacticus")} — ${requiresReauth ? statusText : (errorText ?? statusText)}`
  const SyncIcon = syncPresentation.Icon

  return (
    <>
      <button
        type="button"
        aria-label={t("nav.addGoal")}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-semibold text-primary"
        data-testid="mobile-create-goal-button"
        onClick={onCreateGoal}
        title={t("nav.addGoal")}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
          <PlusCircle className="size-6" aria-hidden="true" />
        </span>
        <span>{t("nav.addGoal")}</span>
      </button>
      <button
        type="button"
        aria-label={syncLabel}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="mobile-sync-button"
        disabled={isSyncing}
        onClick={syncNow}
        title={syncLabel}
      >
        <span
          className={cn(
            "relative flex size-11 items-center justify-center rounded-full shadow-md",
            syncPresentation.className
          )}
        >
          <SyncIcon
            aria-hidden="true"
            className={cn("size-6", isSyncing && "motion-safe:animate-spin")}
          />
          {status === "stale" ? (
            <span
              aria-hidden="true"
              className="absolute top-1 right-1 size-2 rounded-full bg-accent-foreground motion-safe:animate-pulse"
            />
          ) : null}
        </span>
        <span>{t("nav.sync")}</span>
      </button>
    </>
  )
}

function MobileNavLink({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  const { t } = useTranslation()
  const isActive = isItemActive(pathname, item.path)

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-medium transition-colors",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
      to={item.path}
    >
      <item.icon className="size-5" />
      <span>{t(item.labelKey)}</span>
    </Link>
  )
}

function MobileBottomNav({
  items,
  onCreateGoal,
}: {
  items: NavItem[]
  onCreateGoal: () => void
}) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState("")
  const homeItem = items.find((item) => item.path === "/home")
  const goalsItem = items.find((item) => item.path === "/goals")
  const dailiesItem = items.find((item) => item.path === "/dailies")
  const filteredItems = items.filter((item) =>
    t(item.labelKey).toLocaleLowerCase().includes(search.toLocaleLowerCase())
  )
  const isMenuItemActive = items.some(
    (item) =>
      !["/home", "/goals", "/dailies"].includes(item.path) &&
      isItemActive(pathname, item.path)
  )

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-(--mobile-nav-height) border-t bg-sidebar pb-[env(safe-area-inset-bottom)]"
      data-testid="primary-nav"
    >
      {homeItem ? <MobileNavLink item={homeItem} pathname={pathname} /> : null}
      {goalsItem ? (
        <MobileNavLink item={goalsItem} pathname={pathname} />
      ) : null}
      <MobileNavActions onCreateGoal={onCreateGoal} />
      {dailiesItem ? (
        <MobileNavLink item={dailiesItem} pathname={pathname} />
      ) : null}
      <Drawer
        direction="bottom"
        onOpenChange={(open) => {
          setMenuOpen(open)
          if (!open) setSearch("")
        }}
        open={menuOpen}
      >
        <DrawerTrigger asChild>
          <button
            type="button"
            aria-label={t("nav.menu")}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[0.65rem] font-medium transition-colors",
              menuOpen || isMenuItemActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            data-testid="mobile-menu-trigger"
          >
            <Menu className="size-5" />
            <span>{t("nav.menu")}</span>
          </button>
        </DrawerTrigger>
        <DrawerContent
          className="h-dvh max-h-dvh p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] before:inset-0 before:rounded-none"
          data-testid="mobile-menu"
        >
          <DrawerHeader className="border-b px-6 py-5 text-left">
            <DrawerTitle className="text-xl">{t("nav.navigation")}</DrawerTitle>
            <DrawerDescription>{t("nav.navigationHint")}</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isActive = isItemActive(pathname, item.path)
                return (
                  <Link
                    key={item.path}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={() => setMenuOpen(false)}
                    to={item.path}
                  >
                    <item.icon className="size-5" />
                    {t(item.labelKey)}
                  </Link>
                )
              })
            ) : (
              <p className="px-3 py-8 text-center text-muted-foreground">
                {t("nav.noResults")}
              </p>
            )}
          </div>
          <DrawerFooter className="border-t px-6 py-4">
            <Input
              aria-label={t("nav.search")}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("nav.search")}
              type="search"
              value={search}
            />
            <DrawerClose asChild>
              <Button className="w-full" variant="secondary">
                {t("common.close")}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </nav>
  )
}
