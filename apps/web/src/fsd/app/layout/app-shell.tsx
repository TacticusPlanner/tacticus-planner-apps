import { useLocation } from "react-router"
import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { useIsAuthenticated } from "@azure/msal-react"

import { GameCatalogProvider, PlayerDataProvider } from "@/app/providers"
import { GoalRefreshProvider, useGoalRefresh } from "@/entities/goal"
import { PlanningSettingsProvider } from "@/entities/planning-setting"
import { CreateGoalSheet } from "@/pages/goals"

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
        {/* Unlike the catalog, player data is per-account and not required to render the shell, so it
            is not gated behind an init screen — it syncs in the background once authenticated. */}
        <PlayerDataProvider baseUrl={apiBaseUrl}>
          <PlanningSettingsProvider>
            <GoalRefreshProvider>
              <ShellContent
                isAuthenticated={isAuthenticated}
                isMobile={isMobile}
                pageTitle={pageTitle}
                visibleItems={visibleItems}
              />
            </GoalRefreshProvider>
          </PlanningSettingsProvider>
        </PlayerDataProvider>
      </GameCatalogInitGate>
    </GameCatalogProvider>
  )
}

function ShellContent({
  isAuthenticated,
  isMobile,
  pageTitle,
  visibleItems,
}: {
  isAuthenticated: boolean
  isMobile: boolean
  pageTitle: string | undefined
  visibleItems: typeof navItems
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const { refreshGoals } = useGoalRefresh()
  const shellProps = {
    isAuthenticated,
    visibleItems,
    pageTitle,
    onCreateGoal: () => setCreateOpen(true),
  }

  return (
    <>
      {isMobile ? (
        <MobileShell {...shellProps} />
      ) : (
        <DesktopShell {...shellProps} />
      )}
      {isAuthenticated ? (
        <CreateGoalSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={refreshGoals}
        />
      ) : null}
    </>
  )
}
import { useState } from "react"
