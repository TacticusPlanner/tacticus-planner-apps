import { Suspense, useState } from "react"
import { Link, Outlet, useLocation } from "react-router"
import { LogIn, PlusCircle, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { useMsal } from "@azure/msal-react"

import { loginRequest } from "@/shared/auth"
import { TourButton } from "@/shared/tour"

import { AuthControl } from "../providers/auth-control"
import { CatalogSyncStatusBadge } from "../providers/catalog-sync-status-badge"
import { LanguageSwitcher } from "../providers/language-switcher"
import { PlayerDataSyncButton } from "../providers/player-data-sync-button"
import { ThemeSwitcher } from "../providers/theme-switcher"
import { AppLogo } from "./app-logo"
import { DesktopNavigationDialog } from "./desktop-navigation-dialog"
import type { NavItem } from "./nav-items"

function LoadingFill() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner className="size-8 text-primary" />
    </div>
  )
}

export function DesktopShell({
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
    <SidebarProvider>
      <AppSidebar
        isAuthenticated={isAuthenticated}
        visibleItems={visibleItems}
        onCreateGoal={onCreateGoal}
      />
      <SidebarInset>
        <header className="flex items-center justify-between gap-2 border-b bg-sidebar px-6 py-4">
          {pageTitle ? (
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {pageTitle}
            </h1>
          ) : (
            <span />
          )}
          <div className="flex shrink-0 items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <TourButton iconOnly />
          </div>
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
}: {
  isAuthenticated: boolean
  visibleItems: NavItem[]
  onCreateGoal: () => void
}) {
  const { t } = useTranslation()
  const { instance } = useMsal()
  const { state } = useSidebar()
  const compact = state === "collapsed"
  const [navigationOpen, setNavigationOpen] = useState(false)

  const handleSignIn = () => {
    void instance.loginRedirect(loginRequest)
  }

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
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <DesktopNavigationDialog
          items={visibleItems}
          onOpenChange={setNavigationOpen}
          open={navigationOpen}
        />
      </SidebarHeader>

      <SidebarContent data-testid="primary-nav">
        <SidebarGroup>
          <SidebarMenu>
            {visibleItems.map((item) => (
              <NavMenuItem key={item.path} item={item} />
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
                tooltip={t("auth.signIn")}
              >
                <LogIn />
                {compact ? null : <span>{t("auth.signIn")}</span>}
              </SidebarMenuButton>
            )}
            <SidebarTrigger />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function NavMenuItem({ item }: { item: NavItem }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
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
          to={item.path}
        >
          <item.icon />
          <span>{t(item.labelKey)}</span>
        </Link>
      </SidebarMenuButton>
      {isActive && item.children?.length ? (
        <SidebarMenuSub>
          {item.children.map((child) => (
            <SidebarMenuSubItem key={child.path}>
              <SidebarMenuSubButton asChild isActive={pathname === child.path}>
                <Link
                  aria-current={pathname === child.path ? "page" : undefined}
                  to={child.path}
                >
                  <span>{t(child.labelKey)}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  )
}
