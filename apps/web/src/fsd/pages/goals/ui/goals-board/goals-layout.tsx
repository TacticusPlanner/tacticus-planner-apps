import { Outlet } from "react-router"

import { PageContainer } from "@/widgets/page-container"

/**
 * Parent route for the Goals area: the Goals list/grid, Projects, and Insights tabs are now
 * rendered by the shared app-shell header's section-tabs row (see `section-tabs.tsx`) instead of
 * here. Planning Settings moved down into `GoalsPage` (goals-navigation spec: it's an Overview-only
 * control) - this layout now only owns `PageContainer` + the `<Outlet/>` for the active tab's page.
 */
export function GoalsLayout() {
  return (
    <PageContainer>
      <Outlet />
    </PageContainer>
  )
}
