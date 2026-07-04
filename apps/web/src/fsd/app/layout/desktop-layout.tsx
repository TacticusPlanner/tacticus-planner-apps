import { Suspense } from "react"
import { Link, Outlet, useLocation } from "react-router"
import { LogIn, Plus, RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
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
} from "@workspace/ui/components/sidebar"
import { Spinner } from "@workspace/ui/components/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { useMsal } from "@azure/msal-react"

import { loginRequest } from "@/shared/auth"
import { TourButton } from "@/shared/tour"

import { AuthControl } from "../providers/auth-control"
import { CatalogSyncStatusBadge } from "../providers/catalog-sync-status-badge"
import { LanguageSwitcher } from "../providers/language-switcher"
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
        <header className="flex items-center gap-3 border-b px-6 py-4">
          {pageTitle ? (
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {pageTitle}
            </h1>
          ) : null}
          <div
            className="ml-auto flex shrink-0 items-center gap-2"
            data-testid="desktop-header-actions"
          >
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

  const handleSignIn = () => {
    void instance.loginRedirect(loginRequest)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center px-2 py-1 group-data-[collapsible=icon]:justify-center">
          <div className="flex min-w-0 items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <AppLogo className="size-6 shrink-0" />
            <span className="truncate text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
              {t("app.name")}
            </span>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block">
                  <SidebarMenuButton
                    className="bg-primary text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground disabled:opacity-80"
                    data-testid="sidebar-create-goal"
                    disabled
                    size="default"
                  >
                    <Plus />
                    <span>{t("nav.createGoal")}</span>
                  </SidebarMenuButton>
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">
                {t("nav.createGoal")}
              </TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="block">
                  <SidebarMenuButton
                    className="border border-sidebar-border bg-background hover:bg-sidebar-accent disabled:opacity-80"
                    data-testid="sidebar-sync-tacticus"
                    disabled
                    size="default"
                  >
                    <RefreshCw />
                    <span>{t("nav.syncWithTacticus")}</span>
                  </SidebarMenuButton>
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">
                {t("nav.syncWithTacticus")}
              </TooltipContent>
            </Tooltip>
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
        <div className="flex flex-col gap-2 px-2 py-1">
          <CatalogSyncStatusBadge />
          {isAuthenticated ? (
            <div
              className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col"
              data-testid="sidebar-profile-row"
            >
              <AuthControl className="min-w-0 flex-1" variant="sidebar" />
              <SidebarTrigger className="shrink-0" />
            </div>
          ) : (
            <div
              className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col"
              data-testid="sidebar-profile-row"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label={t("auth.signIn")}
                    className="min-w-0 flex-1 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:px-0"
                    data-testid="auth-sign-in"
                    onClick={handleSignIn}
                    size="sm"
                    variant="outline"
                  >
                    <LogIn />
                    <span className="group-data-[collapsible=icon]:hidden">
                      {t("auth.signIn")}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{t("auth.signIn")}</TooltipContent>
              </Tooltip>
              <SidebarTrigger className="shrink-0" />
            </div>
          )}
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
