import { useLocation } from "react-router"
import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { useIsAuthenticated } from "@azure/msal-react"

import { GameCatalogProvider } from "@/shared/game-catalog"

import { GameCatalogInitGate } from "../game-catalog-init-gate"
import { DesktopShell } from "./desktop-layout"
import { MobileShell } from "./mobile-layout"
import { navItems } from "./nav-items"

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

export function AppShell() {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const isAuthenticated = useIsAuthenticated()
  const { pathname } = useLocation()

  const visibleItems = navItems.filter(
    (item) => isAuthenticated || item.anonymousAllowed
  )

  const activeItem = navItems.find(
    (item) => pathname === item.path || pathname.startsWith(item.path + "/")
  )
  const pageTitle = activeItem ? t(activeItem.labelKey) : undefined

  return (
    <GameCatalogProvider baseUrl={apiBaseUrl}>
      <GameCatalogInitGate>
        {isMobile ? (
          <MobileShell
            isAuthenticated={isAuthenticated}
            visibleItems={visibleItems}
            pageTitle={pageTitle}
          />
        ) : (
          <DesktopShell
            isAuthenticated={isAuthenticated}
            visibleItems={visibleItems}
            pageTitle={pageTitle}
          />
        )}
      </GameCatalogInitGate>
    </GameCatalogProvider>
  )
}
