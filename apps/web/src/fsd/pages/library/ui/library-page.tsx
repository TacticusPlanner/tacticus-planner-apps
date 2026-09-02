import { Outlet } from "react-router"

import { PageContainer } from "@/widgets/page-container"

/**
 * Parent route for the Library area: child pages are rendered by the shared app-shell
 * header's section-tabs row (see `section-tabs.tsx`) instead of a tab bar here - this layout keeps
 * only the `<Outlet/>` for the active tab's page. Collections own their own URL-backed selection
 * and may progressively add richer entity details without changing the route contract.
 */
export function LibraryPage() {
  return (
    <PageContainer>
      <Outlet />
    </PageContainer>
  )
}
