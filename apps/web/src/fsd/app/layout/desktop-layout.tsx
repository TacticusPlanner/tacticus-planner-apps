import { Suspense } from "react"
import { Link, Outlet, useLocation } from "react-router"
import { LogIn, PlusCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
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
import { useMsal } from "@azure/msal-react"

import { loginRequest } from "@/shared/auth"

import { AuthControl } from "../providers/auth-control"
import { CatalogSyncStatusBadge } from "../providers/catalog-sync-status-badge"
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
        <header className="flex items-center gap-2 border-b px-6 py-4">
          {pageTitle ? (
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {pageTitle}
            </h1>
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
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex min-w-0 items-center gap-2">
            <AppLogo className="size-6 shrink-0" />
            <span className="truncate text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
              {t("app.name")}
            </span>
          </div>
          <SidebarTrigger />
        </div>
        <div className="px-2 pb-1 group-data-[collapsible=icon]:hidden">
          {isAuthenticated ? (
            <Button className="w-full" disabled size="sm" variant="outline">
              <PlusCircle />
              {t("nav.createGoal")}
            </Button>
          ) : (
            <Button className="w-full" size="sm" onClick={handleSignIn}>
              <LogIn />
              {t("auth.signIn")}
            </Button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
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
          <div className="group-data-[collapsible=icon]:hidden">
            <CatalogSyncStatusBadge />
          </div>
          {isAuthenticated ? (
            <>
              <Separator />
              <AuthControl />
            </>
          ) : null}
          <Separator className="group-data-[collapsible=icon]:hidden" />
          <div className="flex flex-wrap items-center gap-2 group-data-[collapsible=icon]:hidden">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <TourButton />
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
