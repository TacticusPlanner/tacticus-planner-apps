import { useTranslation } from "react-i18next"
import { shopIcon } from "@workspace/game-catalog"
import type { ShopDayOfWeek } from "@workspace/game-catalog"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import { EntityIcon } from "@/shared/ui"

import { LIBRARY_SHOP_IDS } from "../../../model/shops/use-library-shops"
import type { LibraryShopId } from "../../../model/shops/use-library-shops"
import type { LibraryShopSlotView } from "../library-shops.view-model"
import { ShopSlotCard } from "../shop-slot-card"
import { ShopsBrowseState } from "../shops-browse-state"

/**
 * Desktop layout (≥768px): an underline shop tab bar under the page toolbar's day select (matching
 * V1's Learn → Daily Shops navigation), then a multi-column slot-card grid.
 */
export function ShopsBrowseDesktop({
  day,
  shopId,
  setShopId,
  slots,
}: {
  day: ShopDayOfWeek
  shopId: LibraryShopId
  setShopId: (shopId: LibraryShopId) => void
  slots: LibraryShopSlotView[]
}) {
  const { t } = useTranslation(["library", "shops"])

  return (
    <div className="space-y-4" data-testid="shops-browse-desktop">
      <Tabs
        value={shopId}
        onValueChange={(value) => setShopId(value as LibraryShopId)}
      >
        <TabsList
          variant="line"
          className="w-full justify-start border-b"
          data-testid="shops-shop-toggle"
        >
          {LIBRARY_SHOP_IDS.map((value) => (
            <TabsTrigger key={value} value={value}>
              <EntityIcon
                alt=""
                className="size-5 shrink-0"
                src={shopIcon(value)}
              />
              {t(`shops.shopName.${value}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <p className="text-sm font-medium">
        {t("shops.availableOn", {
          shop: t(`shops.shopName.${shopId}`),
          day: t(`shops.days.${day}`),
        })}
      </p>

      {slots.length === 0 ? (
        <ShopsBrowseState state="empty" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {slots.map((slot, index) => (
            <ShopSlotCard key={index} slot={slot} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
