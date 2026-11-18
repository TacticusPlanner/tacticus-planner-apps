import { useTranslation } from "react-i18next"
import { shopDaysOfWeek, shopIcon } from "@workspace/game-catalog"
import type { ShopDayOfWeek } from "@workspace/game-catalog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { EntityIcon, PageToolbar } from "@/shared/ui"

import { LIBRARY_SHOP_IDS } from "../../model/shops/use-library-shops"
import type { LibraryShopId } from "../../model/shops/use-library-shops"

/**
 * The Daily Shops page toolbar (ui-style-guide rule 2). Find: the day, a labelled select because
 * seven choices do not fit a segmented button. On mobile the shop select sits beside it; desktop
 * shows the shops as underline tabs above the cards instead.
 */
export function ShopsToolbar({
  day,
  setDay,
  shopId,
  setShopId,
  showShopSelect,
}: {
  day: ShopDayOfWeek
  setDay: (day: ShopDayOfWeek) => void
  shopId: LibraryShopId
  setShopId: (shopId: LibraryShopId) => void
  showShopSelect: boolean
}) {
  const { t } = useTranslation(["library", "shops"])
  const dayName = t(`shops.days.${day}`)
  const shopName = t(`shops.shopName.${shopId}`)

  return (
    <PageToolbar
      find={
        <>
          <Select
            value={day}
            onValueChange={(value) => setDay(value as ShopDayOfWeek)}
          >
            {/* A combobox is not named by its content, so the label carries the current day too. */}
            <SelectTrigger
              aria-label={`${t("shops.dayLabel")}: ${dayName}`}
              className="min-w-0"
              data-testid="shops-day-select"
            >
              <span className="text-muted-foreground">
                {t("shops.dayLabel")}:
              </span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="start">
              {shopDaysOfWeek.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`shops.days.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showShopSelect ? (
            <Select
              value={shopId}
              onValueChange={(value) => setShopId(value as LibraryShopId)}
            >
              <SelectTrigger
                aria-label={`${t("shops.shopLabel")}: ${shopName}`}
                className="min-w-0"
                data-testid="shops-shop-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {LIBRARY_SHOP_IDS.map((value) => (
                  <SelectItem key={value} value={value}>
                    <EntityIcon
                      alt=""
                      className="size-5 shrink-0"
                      src={shopIcon(value)}
                    />
                    {t(`shops.shopName.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </>
      }
      testId="shops-toolbar"
    />
  )
}
