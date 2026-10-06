import { Outlet } from "react-router"

import { PageContainer } from "@/widgets/page-container"

/**
 * Parent route for the Events section: its child pages (Legendary Events today) are listed by the
 * shared app-shell header's section menu (see `section-tabs.tsx`), so this layout keeps only the
 * `<Outlet/>` for the active page.
 */
export function EventsLayout() {
  return (
    <PageContainer>
      <Outlet />
    </PageContainer>
  )
}
