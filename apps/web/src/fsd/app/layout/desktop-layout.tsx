import { Suspense, useEffect, useRef } from "react"
import { Link, Outlet, useLocation } from "react-router"
import { PanelLeftClose, PanelLeftOpen, PlusCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { CommandShortcut } from "@workspace/ui/components/command"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { Spinner } from "@workspace/ui/components/spinner"
import { PageTourButton, TourButton } from "@/shared/tour"

import { PlayerDataSyncButton } from "../providers/player-data-sync-button"
import { DesktopSectionHeader } from "./desktop-section-header"
import { DesktopSectionNavigation } from "./desktop-section-navigation"
import { DesktopTopBar } from "./desktop-top-bar"
import { isMacPlatform } from "./is-mac-platform"
import { NavLiveDot } from "./nav-live-dot"
import type { NavItem } from "./nav-items"
import type { QuickActionsController } from "./quick-actions"

function LoadingFill() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner className="size-8 text-primary" />
    </div>
  )
}

export function DesktopShell({
  activeSection,
  visibleItems,
  pageDescription,
  sectionTitle,
  onCreateGoal,
  getEntryPath,
  quickActions,
  primaryExpanded,
  onPrimaryExpandedChange,
  sectionExpanded,
  onSectionExpandedChange,
}: {
  activeSection: NavItem | undefined
  visibleItems: NavItem[]
  pageDescription: string | undefined
  sectionTitle: string | undefined
  onCreateGoal: () => void
  getEntryPath: (item: NavItem) => string
  quickActions: QuickActionsController
  // Menu presentation is owned by the caller (above the desktop/mobile branch) so it survives
  // navigation and breakpoint changes, and resets only with a new document.
  primaryExpanded: boolean
  onPrimaryExpandedChange: (expanded: boolean) => void
  sectionExpanded: boolean
  onSectionExpandedChange: (expanded: boolean) => void
}) {
  // The expand and collapse buttons are different elements (panel vs. page header), so hand
  // focus to whichever one replaces the clicked button.
  const moveFocusToToggle = useRef(false)
  const changeSectionExpanded = (expanded: boolean, moveFocus = true) => {
    moveFocusToToggle.current = moveFocus
    onSectionExpandedChange(expanded)
  }
  useEffect(() => {
    if (!moveFocusToToggle.current) return
    moveFocusToToggle.current = false
    document
      .querySelector<HTMLElement>('[data-testid="desktop-section-toggle"]')
      ?.focus()
  }, [sectionExpanded])

  // Ctrl/Cmd+B toggles the section menu (the main rail has no shortcut). It acts only on pages whose
  // section has a menu, and only hands focus to the toggle when focus was inside the hiding panel.
  const hasSectionMenu = Boolean(activeSection?.children?.length)
  useEffect(() => {
    if (!hasSectionMenu) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || !(event.metaKey || event.ctrlKey)) return
      if (event.key.toLowerCase() !== "b") return

      event.preventDefault()
      const panel = document.querySelector(
        '[data-testid="desktop-section-navigation"]'
      )
      changeSectionExpanded(
        !sectionExpanded,
        Boolean(panel?.contains(document.activeElement))
      )
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  })

  return (
    <div className="flex min-h-svh flex-col">
      <DesktopTopBar
        getEntryPath={getEntryPath}
        quickActions={quickActions}
        visibleItems={visibleItems}
      />
      <SidebarProvider
        className="min-h-0 flex-1"
        keyboardShortcut={false}
        onOpenChange={onPrimaryExpandedChange}
        open={primaryExpanded}
        style={{ "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}
      >
        <AppSidebar
          visibleItems={visibleItems}
          onCreateGoal={onCreateGoal}
          getEntryPath={getEntryPath}
        />
        <SidebarInset>
          <div className="flex min-h-0 flex-1">
            {activeSection?.children?.length ? (
              <DesktopSectionNavigation
                expanded={sectionExpanded}
                item={activeSection}
                onExpandedChange={changeSectionExpanded}
              />
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col">
              <header className="border-b bg-page-header">
                <div className="flex items-center justify-between gap-2 px-6 pt-4 pb-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <DesktopSectionHeader
                      item={activeSection}
                      onSectionExpandedChange={changeSectionExpanded}
                      sectionExpanded={sectionExpanded}
                      title={sectionTitle}
                    />
                    {/* Renders only on a page that registered its own tour - the app-wide navigation
                      tour lives on the sidebar footer's persistent "Show me around" button. */}
                    <PageTourButton className="shrink-0" />
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
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

function AppSidebar({
  visibleItems,
  onCreateGoal,
  getEntryPath,
}: {
  visibleItems: NavItem[]
  onCreateGoal: () => void
  getEntryPath: (item: NavItem) => string
}) {
  const { t } = useTranslation()
  const { state } = useSidebar()
  const compact = state === "collapsed"
  const shortcutHint = (key: string) =>
    isMacPlatform() ? `⌘${key}` : `Ctrl+${key}`

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (!(event.metaKey || event.ctrlKey)) return

      if (event.key === "g") {
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
    <Sidebar className="top-12! h-[calc(100svh-3rem)]" collapsible="icon">
      <SidebarHeader>
        {/* Rail tools come first: the expand/collapse toggle, then the general tour. */}
        <div
          className="flex flex-col items-start gap-2"
          data-testid="desktop-sidebar-tools"
        >
          <RailToggle />
          <TourButton
            className={compact ? undefined : "h-8 w-full justify-start"}
            iconOnly={compact}
          />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="desktop-create-goal-button"
              onClick={onCreateGoal}
              tooltip={t("nav.createGoal")}
            >
              <PlusCircle />
              <span>{t("nav.createGoal")}</span>
              {compact ? null : (
                <CommandShortcut className="text-primary-foreground/90">
                  {shortcutHint("G")}
                </CommandShortcut>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <PlayerDataSyncButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent data-testid="primary-nav">
        <SidebarGroup>
          <nav aria-label={t("nav.primaryNavigation")}>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <NavMenuItem
                  key={item.path}
                  getEntryPath={getEntryPath}
                  item={item}
                />
              ))}
            </SidebarMenu>
          </nav>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

/** Full-width rail row (like Azure's «): the whole row toggles the rail, with the icon at the
 *  right end when expanded and on the shared icon axis when compact. */
function RailToggle() {
  const { open, toggleSidebar } = useSidebar()
  const Icon = open ? PanelLeftClose : PanelLeftOpen

  return (
    <button
      aria-expanded={open}
      className="flex h-8 w-full items-center justify-end rounded-xl px-2 text-sidebar-foreground outline-hidden group-data-[collapsible=icon]:justify-start hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-sidebar-ring [&>svg]:size-4"
      data-slot="sidebar-trigger"
      onClick={toggleSidebar}
      type="button"
    >
      <Icon />
      <span className="sr-only">Toggle Sidebar</span>
    </button>
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
  const { t } = useTranslation(["common", "dailies", "library"])
  const { pathname } = useLocation()
  const compact = useSidebar().state === "collapsed"
  const isActive =
    pathname === item.path || pathname.startsWith(item.path + "/")

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
          <span className="relative flex shrink-0">
            <item.icon />
            {compact ? <NavLiveDot corner item={item} /> : null}
          </span>
          <span>
            {t(item.labelKey)}
            {compact ? null : <NavLiveDot item={item} />}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
