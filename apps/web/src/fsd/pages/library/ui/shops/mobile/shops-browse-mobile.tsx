import { useTranslation } from "react-i18next"
import type { ShopDayOfWeek } from "@workspace/game-catalog"

import type { LibraryShopId } from "../../../model/shops/use-library-shops"
import type { LibraryShopSlotView } from "../library-shops.view-model"
import { ShopSlotCard } from "../shop-slot-card"
import { ShopsBrowseState } from "../shops-browse-state"

/**
 * Mobile layout (<768px): a single-column list of slot cards under the page toolbar's day and shop
 * selects, distinct from the desktop shop tabs + card grid rather than a reflow.
 */
export function ShopsBrowseMobile({
  day,
  shopId,
  slots,
}: {
  day: ShopDayOfWeek
  shopId: LibraryShopId
  slots: LibraryShopSlotView[]
}) {
  const { t } = useTranslation(["library", "shops"])

  return (
    <div className="space-y-4" data-testid="shops-browse-mobile">
      <p className="text-sm font-medium">
        {t("shops.availableOn", {
          shop: t(`shops.shopName.${shopId}`),
          day: t(`shops.days.${day}`),
        })}
      </p>

      {slots.length === 0 ? (
        <ShopsBrowseState state="empty" />
      ) : (
        <div className="flex flex-col gap-2">
          {slots.map((slot, index) => (
            <ShopSlotCard key={index} slot={slot} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
