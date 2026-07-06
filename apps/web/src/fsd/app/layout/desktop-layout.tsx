import { Suspense } from "react"
import { Link, Outlet, useLocation } from "react-router"
import { LogIn, PlusCircle, RefreshCw } from "lucide-react"
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
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { Spinner } from "@workspace/ui/components/spinner"
import { cn } from "@workspace/ui/lib/utils"
import { useMsal } from "@azure/msal-react"

import { loginRequest } from "@/shared/auth"
import { usePlayerDataStatus } from "@/shared/player-data"
import { TourButton } from "@/shared/tour"

import { AuthControl } from "../providers/auth-control"
import { CatalogSyncStatusBadge } from "../providers/catalog-sync-status-badge"
import { LanguageSwitcher } from "../providers/language-switcher"
import { PlayerDataSyncStatusBadge } from "../providers/player-data-sync-status-badge"
import { ThemeSwitcher } from "../providers/theme-switcher"
import { AppLogo } from "./app-logo"
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
}: {
  isAuthenticated: boolean
  visibleItems: NavItem[]
  pageTitle: string | undefined
}) {
  return (
    <SidebarProvider>
      <AppSidebar
        isAuthenticated={isAuthenticated}
        visibleItems={visibleItems}
      />
      <SidebarInset>
        <header className="flex items-center justify-between gap-2 border-b px-6 py-4">
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
            <TourButton />
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
}: {
  isAuthenticated: boolean
  visibleItems: NavItem[]
}) {
  const { t } = useTranslation()
  const { instance } = useMsal()
  const { state } = useSidebar()
  const compact = state === "collapsed"
  const { syncNow } = usePlayerDataStatus()

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
              disabled
              tooltip={t("nav.createGoal")}
            >
              <PlusCircle />
              <span>{t("nav.createGoal")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={syncNow}
              tooltip={t("nav.syncWithTacticus")}
            >
              <RefreshCw />
              <span>{t("nav.syncWithTacticus")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
          <PlayerDataSyncStatusBadge compact={compact} />
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
      <SidebarMenuButton asChild isActive={isActive} tooltip={t(item.labelKey)}>
        <Link to={item.path}>
          <item.icon />
          <span>{t(item.labelKey)}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
