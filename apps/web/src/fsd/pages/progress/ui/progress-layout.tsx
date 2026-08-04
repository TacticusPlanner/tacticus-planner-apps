import { Outlet } from "react-router"

import { PageContainer } from "@/widgets/page-container"

/**
 * Parent route for the Progress area: Onslaught/Campaigns/Campaign Events/XP Income are now
 * rendered by the shared app-shell header's section-tabs row (see `section-tabs.tsx`) instead of
 * a tab bar here - this layout keeps only the `<Outlet/>` for the active tab's page.
 */
export function ProgressLayout() {
  return (
    <PageContainer>
      <Outlet />
    </PageContainer>
  )
}
