import { Outlet, useMatch } from "react-router"

import { PageContainer } from "@/widgets/page-container"

/**
 * Parent route for the Legendary Events section: its children (the active events and the All
 * events hub) are listed by the shared app-shell header's section menu (see `use-nav-items.ts`),
 * so this layout keeps only the `<Outlet/>` for the active page. Below the hub (an event page, the
 * master table, the tier list) the page drops the width cap, so side-by-side lanes use the whole
 * screen like V1.
 */
export function LegendaryEventsLayout() {
  const belowHub = useMatch("/legendary-events/:segment/*")
  return (
    <PageContainer
      className={belowHub ? "max-w-none" : undefined}
      data-wide={belowHub ? "true" : undefined}
      data-testid="legendary-events-layout"
    >
      <Outlet />
    </PageContainer>
  )
}
