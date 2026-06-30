import { Suspense } from "react"
import { Link, Outlet, useLocation } from "react-router"
import { LogIn, PlusCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { GameCatalogProvider } from "@workspace/game-catalog"
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
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"
import { useIsAuthenticated, useMsal } from "@azure/msal-react"

import { loginRequest } from "@/shared/auth"

import { GameCatalogInitGate } from "../game-catalog-init-gate"
import { AuthControl } from "../providers/auth-control"
import { CatalogSyncStatusBadge } from "../providers/catalog-sync-status-badge"
import { LanguageSwitcher } from "../providers/language-switcher"
import { ThemeSwitcher } from "../providers/theme-switcher"
import { navItems, type NavItem } from "./nav-items"

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

function LoadingFill() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner className="size-8 text-primary" />
    </div>
  )
}

export function AppShell() {
  const isMobile = useIsMobile()
  const isAuthenticated = useIsAuthenticated()
  const visibleItems = navItems.filter(
    (item) => isAuthenticated || item.anonymousAllowed
  )

  return (
    <GameCatalogProvider baseUrl={apiBaseUrl}>
      <GameCatalogInitGate>
        {isMobile ? (
          <MobileShell
            isAuthenticated={isAuthenticated}
            visibleItems={visibleItems}
          />
        ) : (
          <SidebarProvider>
            <AppSidebar
              isAuthenticated={isAuthenticated}
              visibleItems={visibleItems}
            />
            <SidebarInset>
              <Suspense fallback={<LoadingFill />}>
                <Outlet />
              </Suspense>
            </SidebarInset>
          </SidebarProvider>
        )}
      </GameCatalogInitGate>
    </GameCatalogProvider>
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

function MobileShell({
  isAuthenticated,
  visibleItems,
}: {
  isAuthenticated: boolean
  visibleItems: NavItem[]
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <MobileHeader isAuthenticated={isAuthenticated} />
      <div className="flex-1 pb-16">
        <Suspense fallback={<LoadingFill />}>
          <Outlet />
        </Suspense>
      </div>
      <MobileBottomNav items={visibleItems} />
    </div>
  )
}

function MobileHeader({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { t } = useTranslation()
  const { instance } = useMsal()

  const handleSignIn = () => {
    void instance.loginRedirect(loginRequest)
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background px-4 py-2">
      <span className="text-sm font-semibold tracking-tight">
        {t("app.name")}
      </span>
      <div className="flex items-center gap-2">
        {!isAuthenticated ? (
          <Button size="sm" onClick={handleSignIn}>
            <LogIn />
            {t("auth.signIn")}
          </Button>
        ) : (
          <AuthControl />
        )}
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>
    </header>
  )
}

function MobileBottomNav({ items }: { items: NavItem[] }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-40 flex h-16 border-t bg-background">
      {items.map((item) => {
        const isActive =
          pathname === item.path || pathname.startsWith(item.path + "/")
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="size-5" />
            <span>{t(item.labelKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
