import { Outlet, useMatch } from "react-router"

import { PageContainer } from "@/widgets/page-container"

/**
 * Parent route for the My Game section: its child pages are switched by the shared app-shell
 * header's section-tabs row (see `section-tabs.tsx`) rather than a tab bar here - this layout keeps
 * only the `<Outlet/>` for the active page. Collection is a dense grid meant to fill the window, so
 * it alone opts out of the shared page width cap and uses tighter side padding on phones.
 */
export function MyGameLayout() {
  const isCollection = useMatch("/my-game/collection") !== null

  return (
    <PageContainer
      className={isCollection ? "max-w-none max-sm:px-2" : undefined}
      data-testid="my-game-layout"
    >
      <Outlet />
    </PageContainer>
  )
}
