import { useTranslation } from "react-i18next"
import { shopDaysOfWeek, type ShopDayOfWeek } from "@workspace/game-catalog"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

import {
  LIBRARY_SHOP_IDS,
  type LibraryShopId,
} from "../hooks/use-library-shops"
import type { LibraryShopSlotView } from "../library-shops.view-model"
import { ShopSlotCard } from "../shop-slot-card"
import { ShopsBrowseState } from "../shops-browse-state"

/**
 * Desktop layout (≥768px): a pill-style day selector row above an underline shop tab bar (matching V1's
 * Learn → Daily Shops navigation), then a multi-column slot-card grid.
 */
export function ShopsBrowseDesktop({
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
    <div className="space-y-4" data-testid="shops-browse-desktop">
      <div
        className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 p-3"
        data-testid="shops-day-toggle"
      >
        <span className="pl-1 text-sm font-medium">{t("shops.dayLabel")}:</span>
        {shopDaysOfWeek.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setDay(value)}
            aria-pressed={value === day}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              value === day
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(`shops.days.${value}`)}
          </button>
        ))}
      </div>

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
              {t(`shops.shopName.${value}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
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
