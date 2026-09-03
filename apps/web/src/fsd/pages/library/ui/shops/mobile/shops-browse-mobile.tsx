import { useTranslation } from "react-i18next"
import { shopDaysOfWeek, type ShopDayOfWeek } from "@workspace/game-catalog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import {
  LIBRARY_SHOP_IDS,
  type LibraryShopId,
} from "../hooks/use-library-shops"
import type { LibraryShopSlotView } from "../library-shops.view-model"
import { ShopSlotCard } from "../shop-slot-card"
import { ShopsBrowseState } from "../shops-browse-state"

/**
 * Mobile layout (<768px): compact day and shop dropdowns stacked above a single-column list of slot
 * cards — distinct from the desktop segmented controls + card grid, not a reflow.
 */
export function ShopsBrowseMobile({
  day,
  setDay,
  shopId,
  setShopId,
  slots,
}: {
  day: ShopDayOfWeek
  setDay: (day: ShopDayOfWeek) => void
  shopId: LibraryShopId
  setShopId: (shopId: LibraryShopId) => void
  slots: LibraryShopSlotView[]
}) {
  const { t } = useTranslation(["library", "shops"])

  return (
    <div className="space-y-4" data-testid="shops-browse-mobile">
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs font-medium">
          {t("shops.dayLabel")}
          <Select
            value={day}
            onValueChange={(value) => setDay(value as ShopDayOfWeek)}
          >
            <SelectTrigger data-testid="shops-day-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {shopDaysOfWeek.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`shops.days.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          {t("shops.shopLabel")}
          <Select
            value={shopId}
            onValueChange={(value) => setShopId(value as LibraryShopId)}
          >
            <SelectTrigger data-testid="shops-shop-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIBRARY_SHOP_IDS.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`shops.shopName.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
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
