import { useTranslation } from "react-i18next"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { ShopsBrowseDesktop } from "./desktop/shops-browse-desktop"
import { useLibraryShops } from "./hooks/use-library-shops"
import { ShopsBrowseMobile } from "./mobile/shops-browse-mobile"
import { ShopsBrowseState } from "./shops-browse-state"
import { useShopsBrowseTutorial } from "./shops-browse-page.tutorial"

/**
 * Public Library page (`/library/shops`) — the V2 equivalent of V1's Learn → Daily Shops. Pick a day
 * of the week and a shop; see every slot that shop can offer that day, resolved by the permissive
 * browsing resolver with no power-level or roster context (renders fully signed-out).
 */
export function ShopsBrowsePage() {
  const { t } = useTranslation(["library", "shops"])
  const isMobile = useIsMobile()
  const view = useLibraryShops()
  useShopsBrowseTutorial()

  return (
    <div className="space-y-5 md:space-y-7" data-testid="shops-browse-page">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">{t("shops.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("shops.subtitle")}</p>
      </div>

      {view.status === "loading" ? (
        <ShopsBrowseState state="loading" />
      ) : view.status === "error" ? (
        <ShopsBrowseState state="error" onRetry={view.retry} />
      ) : isMobile ? (
        <ShopsBrowseMobile
          day={view.day}
          setDay={view.setDay}
          shopId={view.shopId}
          setShopId={view.setShopId}
          slots={view.slots}
        />
      ) : (
        <ShopsBrowseDesktop
          day={view.day}
          setDay={view.setDay}
          shopId={view.shopId}
          setShopId={view.setShopId}
          slots={view.slots}
        />
      )}
    </div>
  )
}
