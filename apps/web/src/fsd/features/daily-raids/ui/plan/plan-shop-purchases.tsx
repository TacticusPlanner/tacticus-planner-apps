import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import { shopCurrencyIcon } from "@/features/shop-rewards/@x/daily-raids"
import { EntityIcon } from "@/shared/ui"
import type { PlanShopPurchase } from "../../model/plan-day-cells"
import { UnitIcon } from "../resource-card"

// Expected values are fractional; show at most one decimal so "2" never reads "2.0".
const rounded = (value: number) => Number(value.toFixed(1))

/** A day card's "Shops" section (spec: day cards list shop purchases after the raided materials):
 *  divider plus one row per unit and shop offer. Rendered only when the day has a purchase. */
export function PlanShopPurchases({
  day,
  purchases,
  selectedUnitId,
}: {
  day: number
  purchases: PlanShopPurchase[]
  selectedUnitId: string | undefined
}) {
  const { t, i18n } = useTranslation(["dailies", "shops"])
  if (purchases.length === 0) return null
  const number = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 1,
  })

  return (
    <>
      <div
        className="flex items-center gap-3 text-xs font-medium tracking-wide text-muted-foreground uppercase"
        data-testid={`plan-day-${day}-shops-divider`}
      >
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
        <h3>{t("dailies:plan.shops")}</h3>
        <span aria-hidden="true" className="h-px flex-1 bg-border" />
      </div>
      <ul className="space-y-1.5" data-testid={`plan-day-${day}-shops`}>
        {purchases.map((purchase) => {
          const dimmed =
            selectedUnitId !== undefined &&
            purchase.unit.unitId !== selectedUnitId
          const shop = t(`shops:shopName.${purchase.shopId}`, {
            defaultValue: purchase.shopId,
          })
          const currency = t(`shops:currency.${purchase.currency}`, {
            defaultValue: purchase.currency,
          })
          const spend = Math.round(purchase.spend)
          return (
            <li
              key={`${purchase.offerId}|${purchase.unit.unitId}`}
              aria-label={t("dailies:plan.shop.label", {
                shop,
                unit: purchase.unit.unitLabel,
                purchases: rounded(purchase.purchases),
                shards: rounded(purchase.shards),
                spend: number.format(spend),
                currency,
              })}
              className={cn(
                "flex items-center gap-2 rounded-xl border bg-card p-1.5 transition-opacity",
                dimmed && "opacity-30"
              )}
              data-dimmed={dimmed || undefined}
              data-testid={`plan-shop-${day}-${purchase.offerId}-${purchase.unit.unitId}`}
            >
              <UnitIcon className="size-8 rounded-full" goal={purchase.unit} />
              <div className="min-w-0 flex-1 text-xs">
                <div className="truncate font-medium">{shop}</div>
                <div className="truncate text-muted-foreground tabular-nums">
                  {t("dailies:plan.shop.expected", {
                    purchases: rounded(purchase.purchases),
                    shards: rounded(purchase.shards),
                  })}
                </div>
              </div>
              <span
                className="flex shrink-0 items-center gap-1 text-xs tabular-nums"
                title={currency}
              >
                <EntityIcon
                  alt=""
                  className="size-4"
                  src={shopCurrencyIcon(purchase.currency)}
                />
                {number.format(spend)}
              </span>
            </li>
          )
        })}
      </ul>
    </>
  )
}
