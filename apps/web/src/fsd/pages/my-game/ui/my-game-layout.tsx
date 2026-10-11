import { Outlet } from "react-router"

import { PageContainer } from "@/widgets/page-container"

/**
 * Parent route for the My Game section: its child pages are switched by the shared app-shell
 * header's section-tabs row (see `section-tabs.tsx`) rather than a tab bar here - this layout keeps
 * only the `<Outlet/>` for the active page.
 */
export function MyGameLayout() {
  return (
    <PageContainer>
      <Outlet />
    </PageContainer>
  )
}
