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
        {pageTitle ? (
          <header className="flex items-center border-b px-6 py-4">
            <h1 className="text-2xl font-semibold tracking-tight">
              {pageTitle}
            </h1>
          </header>
        ) : null}
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
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-sm font-semibold tracking-tight">
            {t("app.name")}
          </span>
          <SidebarTrigger />
        </div>
        <div className="px-2 pb-1">
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
          <CatalogSyncStatusBadge />
          {isAuthenticated ? (
            <>
              <Separator />
              <AuthControl />
            </>
          ) : null}
          <Separator />
          <div className="flex flex-wrap items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
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
      <SidebarMenuButton asChild isActive={isActive}>
        <Link to={item.path}>
          <item.icon />
          <span>{t(item.labelKey)}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
