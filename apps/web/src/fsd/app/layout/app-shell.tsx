import { lazy, Suspense, useEffect, useState } from "react"
import { useLocation } from "react-router"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { useIsAuthenticated } from "@azure/msal-react"

import {
  GameCatalogProvider,
  PlayerDataProvider,
  PostHogProvider,
  UserJotProvider,
} from "@/app/providers"
import { goalQueries } from "@/entities/goal"
import { projectQueries } from "@/entities/project"
import {
  CreateGoalLauncherProvider,
  type CreateGoalPrefill,
} from "@/pages/goals"

import { GameCatalogInitGate } from "../game-catalog-init-gate"
import { HseLiveProvider } from "./hse-live-provider"
import { DesktopShell } from "./desktop-layout"
import { documentTitle } from "./document-title"
import { MobileShell } from "./mobile-layout"
import type { NavItem } from "./nav-items"
import { navItems } from "./nav-items"
import { resolveActiveNavigation } from "./resolve-active-navigation"
import { createGoalScopeProjectId } from "./create-goal-scope"
import { useDesktopMenuState } from "./use-desktop-menu-state"
import { useQuickActions } from "./use-quick-actions"
import { useSectionEntryPath } from "./use-section-entry-path"

// Idle until the user opens it (via onCreateGoal), so it's lazy-loaded rather than pulled into the
// shell's own chunk — mirrors the route-level lazy-load idiom in routes.tsx.
const CreateGoalSheet = lazy(() =>
  import("@/pages/goals").then((m) => ({ default: m.CreateGoalSheet }))
)

const QuickCreateProjectSheet = lazy(() =>
  import("./quick-create-project-sheet").then((m) => ({
    default: m.QuickCreateProjectSheet,
  }))
)

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

export function AppShell() {
  // Also declares the `dailies` namespace: Dailies' child labels/descriptions live there instead
  // of `common.json` (see nav-items.ts), and `t()` needs it declared to type-check the union key.
  const { t } = useTranslation(["common", "dailies", "library"])
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

  useEffect(() => {
    document.title = documentTitle(pageTitle, t("app.name"))
  }, [pageTitle, t])

  return (
    <GameCatalogProvider baseUrl={apiBaseUrl}>
      <GameCatalogInitGate>
        {/* Unlike the catalog, player data is per-account and not required to render the shell, so it
            is not gated behind an init screen — it syncs in the background once authenticated. */}
        <PlayerDataProvider baseUrl={apiBaseUrl}>
          <UserJotProvider>
            <PostHogProvider routeGroup={activeItem?.path}>
              <ShellContent
                activeSection={activeItem}
                isAuthenticated={isAuthenticated}
                isMobile={isMobile}
                pageDescription={pageDescription}
                pageTitle={pageTitle}
                sectionTitle={sectionTitle}
                visibleItems={visibleItems}
              />
            </PostHogProvider>
          </UserJotProvider>
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
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  // Lives here, above the mobile/desktop branch, so it survives route changes and breakpoint
  // crossings.
  const {
    primaryExpanded,
    setPrimaryExpanded,
    sectionExpanded,
    setSectionExpanded,
  } = useDesktopMenuState()
  const { pathname, search } = useLocation()
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
  const onCreateGoal = () => {
    const projectId = createGoalScopeProjectId(pathname, search)
    launchCreateGoal(projectId ? { projectIds: [projectId] } : undefined)
  }
  const quickActions = useQuickActions({
    isAuthenticated,
    onCreateGoal,
    onCreateProject: () => setCreateProjectOpen(true),
  })
  const shellProps = {
    activeSection,
    isAuthenticated,
    visibleItems,
    pageDescription,
    pageTitle,
    sectionTitle,
    // Global entry points (sidebar, bottom nav, Ctrl/Cmd+G) preselect the Goals page's project scope.
    onCreateGoal,
    quickActions,
  }

  const shell = (
    <CreateGoalLauncherProvider onLaunch={launchCreateGoal}>
      {isMobile ? (
        <MobileShell {...shellProps} />
      ) : (
        <DesktopShell
          {...shellProps}
          getEntryPath={getEntryPath}
          onPrimaryExpandedChange={setPrimaryExpanded}
          onSectionExpandedChange={setSectionExpanded}
          primaryExpanded={primaryExpanded}
          sectionExpanded={sectionExpanded}
        />
      )}
      {isAuthenticated ? (
        <Suspense fallback={null}>
          <CreateGoalSheet
            open={createOpen}
            onOpenChange={handleCreateOpenChange}
            onCreated={refreshGoals}
            prefill={createPrefill}
          />
          <QuickCreateProjectSheet
            onOpenChange={setCreateProjectOpen}
            open={createProjectOpen}
          />
        </Suspense>
      ) : null}
    </CreateGoalLauncherProvider>
  )

  // One shared HSE query for the nav indicators; signed-out visitors never read the calendar.
  return isAuthenticated ? <HseLiveProvider>{shell}</HseLiveProvider> : shell
}
