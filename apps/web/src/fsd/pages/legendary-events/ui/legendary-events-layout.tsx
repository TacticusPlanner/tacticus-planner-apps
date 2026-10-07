import { Outlet } from "react-router"

import { PageContainer } from "@/widgets/page-container"

/**
 * Parent route for the Legendary Events section: its children (the active events and the All
 * events hub) are listed by the shared app-shell header's section menu (see `use-nav-items.ts`),
 * so this layout keeps only the `<Outlet/>` for the active page.
 */
export function LegendaryEventsLayout() {
  return (
    <PageContainer>
      <Outlet />
    </PageContainer>
  )
}
