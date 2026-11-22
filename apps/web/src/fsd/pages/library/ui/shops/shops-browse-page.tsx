import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { ShopsBrowseDesktop } from "./desktop/shops-browse-desktop"
import { useLibraryShops } from "../../model/shops/use-library-shops"
import { ShopsBrowseMobile } from "./mobile/shops-browse-mobile"
import { ShopsBrowseState } from "./shops-browse-state"
import { ShopTabs } from "./shop-tabs"
import { useShopsBrowseTutorial } from "./shops-browse-page.tutorial"
import { ShopsToolbar } from "./shops-toolbar"

/**
 * Public Library page (`/library/shops`) — the V2 equivalent of V1's Learn → Daily Shops. Pick a day
 * of the week (page toolbar) and a shop; see every slot that shop can offer that day, resolved by the permissive
 * browsing resolver with no power-level or roster context (renders fully signed-out).
 */
export function ShopsBrowsePage() {
  const isMobile = useIsMobile()
  const view = useLibraryShops()
  useShopsBrowseTutorial()

  return (
    <div className="flex flex-col gap-4" data-testid="shops-browse-page">
      {view.status === "loading" ? (
        <ShopsBrowseState state="loading" />
      ) : view.status === "error" ? (
        <ShopsBrowseState state="error" onRetry={view.retry} />
      ) : (
        <>
          <ShopsToolbar day={view.day} setDay={view.setDay} />
          <ShopTabs setShopId={view.setShopId} shopId={view.shopId}>
            {isMobile ? (
              <ShopsBrowseMobile
                day={view.day}
                shopId={view.shopId}
                slots={view.slots}
              />
            ) : (
              <ShopsBrowseDesktop
                day={view.day}
                shopId={view.shopId}
                slots={view.slots}
              />
            )}
          </ShopTabs>
        </>
      )}
    </div>
  )
}
