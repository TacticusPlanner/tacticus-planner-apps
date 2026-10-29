import { Outlet, useMatch } from "react-router"

import { useGoalsView } from "@/entities/planning-setting"
import { PageContainer } from "@/widgets/page-container"

/**
 * Parent route for the Goals area: the Goals list/grid, Projects, and Insights tabs are now
 * rendered by the shared app-shell header's section-tabs row (see `section-tabs.tsx`) instead of
 * here. Planning Settings moved down into `GoalsPage` (goals-navigation spec: it's an Overview-only
 * control) - this layout now only owns `PageContainer` + the `<Outlet/>` for the active tab's page.
 * The Goals tab in Cards view drops the container's width cap so the grid adds columns on wide
 * screens (goal-list-layout); the table and the other tabs keep it.
 */
export function GoalsLayout() {
  const onGoals = useMatch("/plan/goals") !== null
  const { view } = useGoalsView()
  return (
    <PageContainer
      className={onGoals && view === "Cards" ? "max-w-none" : undefined}
      data-testid="goals-page-container"
    >
      <Outlet />
    </PageContainer>
  )
}
