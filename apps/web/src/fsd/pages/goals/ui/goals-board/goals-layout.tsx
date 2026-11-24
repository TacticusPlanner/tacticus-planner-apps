import { Outlet, useMatch } from "react-router"

import { PageContainer } from "@/widgets/page-container"

/**
 * Parent route for the Goals area: the Goals list/grid, Projects, and Insights tabs are now
 * rendered by the shared app-shell header's section-tabs row (see `section-tabs.tsx`) instead of
 * here. Planning Settings moved down into `GoalsPage` (goals-navigation spec: it's an Overview-only
 * control) - this layout now only owns `PageContainer` + the `<Outlet/>` for the active tab's page.
 * The Goals tab drops the container's width cap in both layouts (goal-list-layout): the card grid
 * adds columns on wide screens and the table gets the room its toolbar needs to stay on one row.
 * The other tabs keep the cap.
 */
export function GoalsLayout() {
  const onGoals = useMatch("/plan/goals") !== null
  return (
    <PageContainer
      className={onGoals ? "max-w-none" : undefined}
      data-testid="goals-page-container"
    >
      <Outlet />
    </PageContainer>
  )
}
