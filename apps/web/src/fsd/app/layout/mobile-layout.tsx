import { Suspense, useState } from "react"
import { Link, Outlet, useLocation } from "react-router"
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  LogIn,
  Menu,
  PlusCircle,
  RefreshCw,
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
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"

import { usePlayerDataSyncStatus } from "../providers/player-data-sync-button"
import { MobileDrawerSubItem } from "./mobile-drawer-sub-item"
import { MobileHeader } from "./mobile-header"
import "./mobile-layout.css"
import { MobileNavLink } from "./mobile-nav-link"
import { filterNavigationItems } from "./navigation-filter"
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
  activeSection,
  isAuthenticated,
  visibleItems,
  pageDescription,
  pageTitle,
  onCreateGoal,
}: {
  activeSection: NavItem | undefined
  isAuthenticated: boolean
  visibleItems: NavItem[]
  pageDescription: string | undefined
  pageTitle: string | undefined
  onCreateGoal: () => void
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <MobileHeader
        activeSection={activeSection}
        isAuthenticated={isAuthenticated}
        pageDescription={pageDescription}
        pageTitle={pageTitle}
      />
      <div className="flex-1 pb-(--mobile-scroll-clearance)">
        <Suspense fallback={<LoadingFill />}>
          <Outlet />
        </Suspense>
      </div>
      <ScrollToTopButton />
      <MobileBottomNav items={visibleItems} onCreateGoal={onCreateGoal} />
    </div>
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

function MobileBottomNav({
  items,
  onCreateGoal,
}: {
  items: NavItem[]
  onCreateGoal: () => void
}) {
  // Also declares the `dailies` namespace: Dailies' child labels/descriptions live there instead
  // of `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies"])
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState("")
  const homeItem = items.find((item) => item.path === "/home")
  const goalsItem = items.find((item) => item.path === "/goals")
  const dailiesItem = items.find((item) => item.path === "/dailies")
  const filteredItems = filterNavigationItems(items, search, t)
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
                  <div key={item.path}>
                    <Link
                      aria-current={pathname === item.path ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent hover:text-accent-foreground"
                      )}
                      onClick={() => setMenuOpen(false)}
                      to={item.path}
                    >
                      <item.icon className="size-5 shrink-0" />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{t(item.labelKey)}</span>
                        <span className="truncate text-xs font-normal text-muted-foreground">
                          {t(item.descriptionKey)}
                        </span>
                      </span>
                    </Link>
                    {item.children?.length ? (
                      <div className="mt-1 ml-8 space-y-1 border-l pl-3">
                        {item.children.map((child) => (
                          <MobileDrawerSubItem
                            key={child.path}
                            item={child}
                            onSelect={() => setMenuOpen(false)}
                            pathname={pathname}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
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
