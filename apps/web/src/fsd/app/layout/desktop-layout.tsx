import { Suspense, useEffect, useRef, useState } from "react"
import { Link, Outlet, useLocation } from "react-router"
import { ChevronRight, LogIn, PlusCircle, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CommandShortcut } from "@workspace/ui/components/command"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@workspace/ui/components/hover-card"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { useMsal } from "@azure/msal-react"

import { loginRequest, useSilentSignInStatus } from "@/shared/auth"
import { TourButton } from "@/shared/tour"

import { AuthControl } from "../providers/auth-control"
import { CatalogSyncStatusBadge } from "../providers/catalog-sync-status-badge"
import { LanguageSwitcher } from "../providers/language-switcher"
import { PlayerDataSyncButton } from "../providers/player-data-sync-button"
import { ThemeSwitcher } from "../providers/theme-switcher"
import { AppLogo } from "./app-logo"
import { DesktopNavigationDialog } from "./desktop-navigation-dialog"
import { DesktopSectionHeader } from "./desktop-section-header"
import { isMacPlatform } from "./is-mac-platform"
import { NavChildrenFlyout } from "./nav-children-flyout"
import type { NavItem } from "./nav-items"

function LoadingFill() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner className="size-8 text-primary" />
    </div>
  )
}

export function DesktopShell({
  activeSection,
  isAuthenticated,
  visibleItems,
  pageDescription,
  sectionTitle,
  onCreateGoal,
  getEntryPath,
}: {
  activeSection: NavItem | undefined
  isAuthenticated: boolean
  visibleItems: NavItem[]
  pageDescription: string | undefined
  sectionTitle: string | undefined
  onCreateGoal: () => void
  getEntryPath: (item: NavItem) => string
}) {
  return (
    <SidebarProvider>
      <AppSidebar
        isAuthenticated={isAuthenticated}
        visibleItems={visibleItems}
        onCreateGoal={onCreateGoal}
        getEntryPath={getEntryPath}
      />
      <SidebarInset>
        <header className="border-b bg-sidebar">
          <div className="flex items-center justify-between gap-2 px-6 pt-4 pb-1">
            <DesktopSectionHeader item={activeSection} title={sectionTitle} />
            <div className="flex shrink-0 items-center gap-2">
              <ThemeSwitcher />
              <LanguageSwitcher />
              <TourButton iconOnly />
            </div>
          </div>
          {pageDescription ? (
            <p className="truncate px-6 pb-3 text-sm text-muted-foreground">
              {pageDescription}
            </p>
          ) : null}
        </header>
        <Suspense fallback={<LoadingFill />}>
          <Outlet />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}

function AppSidebar({
  isAuthenticated,
  visibleItems,
  onCreateGoal,
  getEntryPath,
}: {
  isAuthenticated: boolean
  visibleItems: NavItem[]
  onCreateGoal: () => void
  getEntryPath: (item: NavItem) => string
}) {
  const { t } = useTranslation()
  const { instance } = useMsal()
  const { state } = useSidebar()
  const compact = state === "collapsed"
  const [navigationOpen, setNavigationOpen] = useState(false)
  const shortcutHint = (key: string) =>
    isMacPlatform() ? `⌘${key}` : `Ctrl+${key}`
  const isCheckingSilentSignIn = useSilentSignInStatus() === "checking"
  const signInLabel = isCheckingSilentSignIn
    ? t("auth.checkingSignIn")
    : t("auth.signIn")

  const handleSignIn = () => {
    void instance.loginRedirect(loginRequest)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (!(event.metaKey || event.ctrlKey)) return

      if (event.key === "k") {
        event.preventDefault()
        setNavigationOpen((open) => !open)
      } else if (event.key === "g") {
        event.preventDefault()
        onCreateGoal()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onCreateGoal])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center">
          <div className="flex min-w-0 items-center gap-2">
            <AppLogo className="size-15 shrink-0" />
            {compact ? null : (
              <span className="truncate text-sm font-semibold tracking-tight">
                {t("app.name")}
              </span>
            )}
          </div>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="bg-primary text-primary-foreground hover:bg-primary/80"
              data-testid="desktop-create-goal-button"
              onClick={onCreateGoal}
              tooltip={t("nav.createGoal")}
            >
              <PlusCircle />
              <span>{t("nav.createGoal")}</span>
              {compact ? null : (
                <CommandShortcut className="text-primary-foreground/70">
                  {shortcutHint("G")}
                </CommandShortcut>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <PlayerDataSyncButton />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              data-testid="desktop-navigation-search"
              onClick={() => setNavigationOpen(true)}
              tooltip={t("nav.search")}
            >
              <Search />
              <span>{t("nav.search")}</span>
              {compact ? null : (
                <CommandShortcut>{shortcutHint("K")}</CommandShortcut>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <DesktopNavigationDialog
          getEntryPath={getEntryPath}
          items={visibleItems}
          onOpenChange={setNavigationOpen}
          open={navigationOpen}
        />
      </SidebarHeader>

      <SidebarContent data-testid="primary-nav">
        <SidebarGroup>
          <SidebarMenu>
            {visibleItems.map((item) => (
              <NavMenuItem
                key={item.path}
                getEntryPath={getEntryPath}
                item={item}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-2">
          <CatalogSyncStatusBadge compact={compact} />
          <div
            className={cn(
              "flex items-center gap-1",
              compact ? "flex-col" : "justify-between"
            )}
          >
            {isAuthenticated ? (
              <AuthControl compact={compact} />
            ) : (
              <SidebarMenuButton
                className="bg-primary text-primary-foreground hover:bg-primary/80"
                onClick={handleSignIn}
                tooltip={signInLabel}
              >
                <LogIn />
                {compact ? null : <span>{signInLabel}</span>}
              </SidebarMenuButton>
            )}
            <SidebarTrigger />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function NavMenuItem({
  item,
  getEntryPath,
}: {
  item: NavItem
  getEntryPath: (item: NavItem) => string
}) {
  // Also declares the `dailies` namespace: Dailies' child labels/descriptions live there instead
  // of `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies"])
  const { pathname } = useLocation()
  const isActive =
    pathname === item.path || pathname.startsWith(item.path + "/")

  if (item.children?.length) {
    return (
      <NavMenuItemWithFlyout
        getEntryPath={getEntryPath}
        isActive={isActive}
        item={item}
        pathname={pathname}
      />
    )
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        data-testid={`desktop-nav-${item.path.slice(1)}`}
        isActive={isActive}
        tooltip={t(item.labelKey)}
      >
        <Link
          aria-current={pathname === item.path ? "page" : undefined}
          to={getEntryPath(item)}
        >
          <item.icon />
          <span>{t(item.labelKey)}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/**
 * A sidebar row for a section with child pages: clicking it still navigates via `getEntryPath`
 * (unchanged), but hovering or clicking it also opens a flyout listing its children beside the
 * row, in both the expanded and icon-collapsed sidebar states. The `›` chevron is a static hint
 * that the row has more behind it, independent of hover state.
 */
function NavMenuItemWithFlyout({
  getEntryPath,
  isActive,
  item,
  pathname,
}: {
  getEntryPath: (item: NavItem) => string
  isActive: boolean
  item: NavItem
  pathname: string
}) {
  const { t } = useTranslation(["common", "dailies"])
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLAnchorElement>(null)

  const closeAndRefocus = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <SidebarMenuItem>
      <HoverCard onOpenChange={setOpen} open={open}>
        <HoverCardTrigger asChild>
          <SidebarMenuButton
            asChild
            data-open={open || undefined}
            data-testid={`desktop-nav-${item.path.slice(1)}`}
            isActive={isActive}
          >
            <Link
              aria-current={pathname === item.path ? "page" : undefined}
              onClick={() => setOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Escape") closeAndRefocus()
              }}
              ref={triggerRef}
              to={getEntryPath(item)}
            >
              <item.icon />
              <span className="truncate">{t(item.labelKey)}</span>
              <ChevronRight
                aria-hidden="true"
                className="ml-auto size-3.5 shrink-0 text-sidebar-foreground/50 group-data-[collapsible=icon]:absolute group-data-[collapsible=icon]:top-0.5 group-data-[collapsible=icon]:right-0.5 group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:size-2.5"
              />
            </Link>
          </SidebarMenuButton>
        </HoverCardTrigger>
        <HoverCardContent
          align="start"
          data-testid={`desktop-nav-flyout-${item.path.slice(1)}`}
          onEscapeKeyDown={closeAndRefocus}
          side="right"
        >
          <NavChildrenFlyout
            item={item}
            onSelect={() => setOpen(false)}
            pathname={pathname}
          />
        </HoverCardContent>
      </HoverCard>
    </SidebarMenuItem>
  )
}
