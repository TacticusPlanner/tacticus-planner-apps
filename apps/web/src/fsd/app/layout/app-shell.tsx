import { lazy, Suspense, useState } from "react"
import { useLocation } from "react-router"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { useIsAuthenticated } from "@azure/msal-react"

import { GameCatalogProvider, PlayerDataProvider } from "@/app/providers"
import { goalQueries } from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import {
  CreateGoalLauncherProvider,
  type CreateGoalPrefill,
} from "@/pages/goals"

import { GameCatalogInitGate } from "../game-catalog-init-gate"
import { DesktopShell } from "./desktop-layout"
import { MobileShell } from "./mobile-layout"
import { navItems } from "./nav-items"

// Idle until the user opens it (via onCreateGoal), so it's lazy-loaded rather than pulled into the
// shell's own chunk — mirrors the route-level lazy-load idiom in routes.tsx.
const CreateGoalSheet = lazy(() =>
  import("@/pages/goals").then((m) => ({ default: m.CreateGoalSheet }))
)

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
          <ShellContent
            isAuthenticated={isAuthenticated}
            isMobile={isMobile}
            pageTitle={pageTitle}
            visibleItems={visibleItems}
          />
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
  const [createPrefill, setCreatePrefill] = useState<CreateGoalPrefill>()
  const queryClient = useQueryClient()
  const refreshGoals = () => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: goalQueries.all() }),
      queryClient.invalidateQueries({ queryKey: projectQueries.all() }),
    ])
  }
  const launchCreateGoal = (prefill?: CreateGoalPrefill) => {
    setCreatePrefill(prefill)
    setCreateOpen(true)
  }
  const handleCreateOpenChange = (open: boolean) => {
    setCreateOpen(open)
    if (!open) setCreatePrefill(undefined)
  }
  const shellProps = {
    isAuthenticated,
    visibleItems,
    pageTitle,
    onCreateGoal: () => launchCreateGoal(),
  }

  return (
    <CreateGoalLauncherProvider onLaunch={launchCreateGoal}>
      {isMobile ? (
        <MobileShell {...shellProps} />
      ) : (
        <DesktopShell {...shellProps} />
      )}
      {isAuthenticated ? (
        <Suspense fallback={null}>
          <CreateGoalSheet
            open={createOpen}
            onOpenChange={handleCreateOpenChange}
            onCreated={refreshGoals}
            prefill={createPrefill}
          />
        </Suspense>
      ) : null}
    </CreateGoalLauncherProvider>
  )
}
