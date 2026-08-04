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
import type { NavItem } from "./nav-items"
import { navItems } from "./nav-items"
import { resolveActiveNavigation } from "./resolve-active-navigation"
import { useSectionEntryPath } from "./use-section-entry-path"

// Idle until the user opens it (via onCreateGoal), so it's lazy-loaded rather than pulled into the
// shell's own chunk — mirrors the route-level lazy-load idiom in routes.tsx.
const CreateGoalSheet = lazy(() =>
  import("@/pages/goals").then((m) => ({ default: m.CreateGoalSheet }))
)

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

export function AppShell() {
  // Also declares the `dailies` namespace: Dailies' child labels/descriptions live there instead
  // of `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies"])
  const isMobile = useIsMobile()
  const isAuthenticated = useIsAuthenticated()
  const { pathname } = useLocation()

  const visibleItems = navItems.filter(
    (item) => isAuthenticated || item.anonymousAllowed
  )

  const { activeItem, activeChild } = resolveActiveNavigation(
    navItems,
    pathname
  )
  const pageTitle = activeChild
    ? t(activeChild.labelKey)
    : activeItem
      ? t(activeItem.labelKey)
      : undefined
  const pageDescription = activeChild
    ? t(activeChild.descriptionKey)
    : activeItem
      ? t(activeItem.descriptionKey)
      : undefined
  // Desktop's header title stays pinned to the top-level section (never swaps to the active
  // child, unlike `pageTitle` above) — see design.md's "Desktop header composition" decision.
  const sectionTitle = activeItem ? t(activeItem.labelKey) : undefined

  return (
    <GameCatalogProvider baseUrl={apiBaseUrl}>
      <GameCatalogInitGate>
        {/* Unlike the catalog, player data is per-account and not required to render the shell, so it
            is not gated behind an init screen — it syncs in the background once authenticated. */}
        <PlayerDataProvider baseUrl={apiBaseUrl}>
          <ShellContent
            activeSection={activeItem}
            isAuthenticated={isAuthenticated}
            isMobile={isMobile}
            pageDescription={pageDescription}
            pageTitle={pageTitle}
            sectionTitle={sectionTitle}
            visibleItems={visibleItems}
          />
        </PlayerDataProvider>
      </GameCatalogInitGate>
    </GameCatalogProvider>
  )
}

function ShellContent({
  activeSection,
  isAuthenticated,
  isMobile,
  pageDescription,
  pageTitle,
  sectionTitle,
  visibleItems,
}: {
  activeSection: NavItem | undefined
  isAuthenticated: boolean
  isMobile: boolean
  pageDescription: string | undefined
  pageTitle: string | undefined
  sectionTitle: string | undefined
  visibleItems: typeof navItems
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [createPrefill, setCreatePrefill] = useState<CreateGoalPrefill>()
  const { pathname } = useLocation()
  const { getEntryPath } = useSectionEntryPath(visibleItems, pathname)
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
    activeSection,
    isAuthenticated,
    visibleItems,
    pageDescription,
    pageTitle,
    sectionTitle,
    onCreateGoal: () => launchCreateGoal(),
  }

  return (
    <CreateGoalLauncherProvider onLaunch={launchCreateGoal}>
      {isMobile ? (
        <MobileShell {...shellProps} />
      ) : (
        <DesktopShell {...shellProps} getEntryPath={getEntryPath} />
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
