import { useTranslation } from "react-i18next"
import type { ShopDayOfWeek } from "@workspace/game-catalog"

import type { LibraryShopId } from "../../../model/shops/use-library-shops"
import type { LibraryShopSlotView } from "../library-shops.view-model"
import { ShopSlotCard } from "../shop-slot-card"
import { ShopsBrowseState } from "../shops-browse-state"

/** Desktop layout (≥768px): a multi-column slot-card grid under the shop tabs. */
export function ShopsBrowseDesktop({
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
    <div className="space-y-4" data-testid="shops-browse-desktop">
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
