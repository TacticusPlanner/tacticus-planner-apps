import { Suspense, useEffect, useRef, useState } from "react"
import { Outlet, useLocation } from "react-router"
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock,
  LogIn,
  Menu,
  PlusCircle,
  RefreshCw,
  UserPlus,
  X,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"
import { cn } from "@workspace/ui/lib/utils"
import { Spinner } from "@workspace/ui/components/spinner"
import { Pressable } from "@workspace/ui/components/pressable"

import {
  AutoSyncFill,
  usePlayerDataSyncStatus,
} from "@/features/player-data-sync"
import { useSignInRedirect } from "@/shared/auth"
import { matchesNavPath } from "./find-active-child"
import { MobileHeader } from "./mobile-header"
import "./mobile-layout.css"
import { MobileNavLink } from "./mobile-nav-link"
import type { NavItem } from "./nav-items"
import {
  LazyNavigationPalette,
  preloadNavigationPalette,
} from "./navigation-palette-lazy"
import type { QuickActionsController } from "./quick-actions"
import { ScrollToTopButton } from "./scroll-to-top-button"
import { RouteLoadingFill } from "./route-loading-fill"
import { SkipLink } from "./skip-link"
import {
  PAGE_HEADING_ID,
  useFocusPageHeadingOnNavigate,
} from "./use-focus-page-heading"

// Matches vaul's exit transition (TRANSITIONS.DURATION = 0.5s).
const DRAWER_EXIT_MS = 500

export function MobileShell({
  activeSection,
  isAuthenticated,
  visibleItems,
  pageDescription,
  pageTitle,
  onCreateGoal,
  quickActions,
}: {
  activeSection: NavItem | undefined
  isAuthenticated: boolean
  visibleItems: NavItem[]
  pageDescription: string | undefined
  pageTitle: string | undefined
  onCreateGoal: () => void
  quickActions: QuickActionsController
}) {
  useFocusPageHeadingOnNavigate()

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <SkipLink />
      <MobileHeader
        activeSection={activeSection}
        isAuthenticated={isAuthenticated}
        pageDescription={pageDescription}
        pageTitle={pageTitle}
      />
      <main
        className="flex-1 pb-(--mobile-scroll-clearance) outline-hidden"
        id="main"
        tabIndex={-1}
      >
        <Suspense fallback={<RouteLoadingFill />}>
          <Outlet />
        </Suspense>
      </main>
      <ScrollToTopButton />
      <MobileBottomNav
        isAuthenticated={isAuthenticated}
        items={visibleItems}
        onCreateGoal={onCreateGoal}
        quickActions={quickActions}
      />
    </div>
  )
}

function MobileNavActions({ onCreateGoal }: { onCreateGoal: () => void }) {
  const { t } = useTranslation()
  const {
    autoSyncProgress,
    cooldownMinutes,
    errorText,
    isSyncing,
    nextAutoSyncText,
    requiresReauth,
    status,
    statusText,
    syncDisabled,
    syncNow,
  } = usePlayerDataSyncStatus()
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
  const syncStatusText = requiresReauth ? statusText : (errorText ?? statusText)
  const syncLabel = `${t("nav.syncWithTacticus")} — ${nextAutoSyncText ? `${syncStatusText} · ${nextAutoSyncText}` : syncStatusText}`
  const SyncIcon = syncPresentation.Icon

  return (
    <>
      <Pressable
        aria-label={t("nav.createGoal")}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold text-primary"
        data-testid="mobile-create-goal-button"
        onClick={onCreateGoal}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
          <PlusCircle className="size-icon-md" aria-hidden="true" />
        </span>
        <span>{t("nav.createGoal")}</span>
      </Pressable>
      <Pressable
        aria-label={syncLabel}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="mobile-sync-button"
        disabled={syncDisabled}
        onClick={syncNow}
      >
        <span
          className={cn(
            "relative flex size-11 items-center justify-center rounded-full shadow-md",
            syncPresentation.className,
            // The countdown track: the unfilled part of the ring reads as a dimmed accent.
            autoSyncProgress && "bg-accent/30"
          )}
        >
          {autoSyncProgress ? (
            <AutoSyncFill fraction={autoSyncProgress.fraction} />
          ) : null}
          {isSyncing ? (
            <Spinner aria-hidden="true" className="relative size-icon-md" />
          ) : (
            <SyncIcon
              aria-hidden="true"
              className={cn(
                "relative size-icon-md",
                // A solid disc behind the icon keeps it legible over the dimmed, partly filled track.
                autoSyncProgress && "rounded-full bg-accent"
              )}
            />
          )}
          {status === "stale" ? (
            <span
              aria-hidden="true"
              className="absolute top-1 right-1 size-2 rounded-full bg-accent-foreground motion-safe:animate-pulse"
            />
          ) : null}
        </span>
        <span>
          {cooldownMinutes === null
            ? t("nav.sync")
            : t("nav.syncCooldown", { minutes: cooldownMinutes })}
        </span>
      </Pressable>
    </>
  )
}

/** A guest's centre action: goals and sync need an account, so the bar offers to create one (the
 *  header already carries Sign in). */
function MobileGuestNavAction() {
  const { t } = useTranslation()
  const { disabled, signUp } = useSignInRedirect()

  return (
    <Pressable
      className="flex flex-1 flex-col items-center justify-center gap-1 text-xs font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50"
      data-testid="mobile-sign-up-button"
      disabled={disabled}
      onClick={signUp}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
        <UserPlus aria-hidden="true" className="size-icon-md" />
      </span>
      <span>{t("auth.signUp")}</span>
    </Pressable>
  )
}

function MobileBottomNav({
  isAuthenticated,
  items,
  onCreateGoal,
  quickActions,
}: {
  isAuthenticated: boolean
  items: NavItem[]
  onCreateGoal: () => void
  quickActions: QuickActionsController
}) {
  // Also declares the `dailies` namespace: Dailies' child labels/descriptions live there instead
  // of `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies", "library", "gameUi"])
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const flushTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // Set when a drawer link closes the drawer: its close then hands focus to the page h1 (which
  // `useFocusPageHeadingOnNavigate` skips while the drawer holds focus), not back to the trigger.
  const focusHeadingOnClose = useRef(false)
  const closeForNavigation = () => {
    focusHeadingOnClose.current = true
    setMenuOpen(false)
  }
  useEffect(() => () => clearTimeout(flushTimer.current), [])
  const homeItem = items.find((item) => item.path === "/home")
  const goalsItem = items.find((item) => item.path === "/plan")
  const dailiesItem = items.find((item) => item.path === "/dailies")
  // A guest has no Home, Goals or Dailies; the two sections open to them take those slots instead.
  const libraryItem = items.find((item) => item.path === "/library")
  const myGameItem = items.find((item) => item.path === "/my-game")
  const barPaths = isAuthenticated
    ? ["/home", "/plan", "/dailies"]
    : ["/library", "/my-game"]
  const isMenuItemActive = items.some(
    (item) =>
      !barPaths.includes(item.path) && matchesNavPath(pathname, item.path)
  )

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-(--mobile-nav-height) border-t bg-topbar pb-[env(safe-area-inset-bottom)]"
      data-testid="primary-nav"
    >
      {isAuthenticated ? (
        <>
          {homeItem ? (
            <MobileNavLink item={homeItem} pathname={pathname} />
          ) : null}
          {goalsItem ? (
            <MobileNavLink item={goalsItem} pathname={pathname} />
          ) : null}
          <MobileNavActions onCreateGoal={onCreateGoal} />
          {dailiesItem ? (
            <MobileNavLink item={dailiesItem} pathname={pathname} />
          ) : null}
        </>
      ) : (
        <>
          {libraryItem ? (
            <MobileNavLink item={libraryItem} pathname={pathname} />
          ) : null}
          <MobileGuestNavAction />
          {myGameItem ? (
            <MobileNavLink item={myGameItem} pathname={pathname} />
          ) : null}
        </>
      )}
      <Drawer direction="bottom" onOpenChange={setMenuOpen} open={menuOpen}>
        <DrawerTrigger asChild>
          <Pressable
            aria-label={t("nav.menu")}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium",
              menuOpen || isMenuItemActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            data-testid="mobile-menu-trigger"
            onFocus={preloadNavigationPalette}
            onPointerEnter={preloadNavigationPalette}
            onTouchStart={preloadNavigationPalette}
          >
            <Menu className="size-icon" />
            <span>{t("nav.menu")}</span>
          </Pressable>
        </DrawerTrigger>
        <DrawerContent
          className="h-dvh max-h-dvh p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] before:inset-0 before:rounded-none"
          data-testid="mobile-menu"
          onCloseAutoFocus={(event) => {
            if (!focusHeadingOnClose.current) return
            focusHeadingOnClose.current = false
            event.preventDefault()
            document
              .getElementById(PAGE_HEADING_ID)
              ?.focus({ preventScroll: true })
          }}
        >
          {/* One line, so the list gets the height; the handle, a swipe and the X close it. */}
          <DrawerHeader className="flex-row items-center justify-between gap-2 border-b px-4 py-2 text-left">
            <DrawerTitle className="text-lg">{t("nav.menu")}</DrawerTitle>
            <DrawerDescription className="sr-only">
              {t("nav.navigationHint")}
            </DrawerDescription>
            <DrawerClose asChild>
              <Button
                aria-label={t("common.close")}
                size="icon"
                variant="ghost"
              >
                <X aria-hidden="true" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <Suspense fallback={null}>
            <LazyNavigationPalette
              actionsAsChips
              density="comfortable"
              getEntryPath={(item) => item.path}
              inputPlacement="bottom"
              items={items}
              onActionSelect={(id) => {
                if (!quickActions.select(id)) return
                // Dismiss the on-screen keyboard before the drawer hands off to the target overlay.
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur()
                }
                setMenuOpen(false)
                // Dispatch once the drawer's exit transition is done so its modal layer no longer
                // holds focus/pointer locks. vaul's onAnimationEnd does not fire for a parent-driven
                // close, so use its own exit duration as a bounded timer (works in hidden tabs).
                clearTimeout(flushTimer.current)
                flushTimer.current = setTimeout(
                  quickActions.flush,
                  DRAWER_EXIT_MS
                )
              }}
              onNavigate={closeForNavigation}
              openedVia="mobileMenu"
              quickActions={quickActions}
            />
          </Suspense>
        </DrawerContent>
      </Drawer>
    </nav>
  )
}
