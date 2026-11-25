import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon, FLOATING_BAR_SURFACE } from "@/shared/ui"

import type { EventShopController } from "./use-event-shop-controller"
import type { EventShopFormat } from "./use-event-shop-format"

/**
 * The sticky bottom control: on tablet the "Shopping list" button that opens the drawer, on phone the
 * "Still to buy" bar that opens Plan. Both carry the Needs review count.
 */
export function EventShopShoppingListTotalsBar({
  controller,
  format,
  kind,
  onActivate,
}: {
  controller: EventShopController
  format: EventShopFormat
  kind: "button" | "bar"
  onActivate: () => void
}) {
  const { t } = useTranslation("eventShops")
  const amount = format.number(controller.list.totals.stillToBuy)
  const review = controller.list.needsReview.length
  const icon = (
    <EntityIcon
      size="inline"
      alt=""

      src={format.currencyIcon(controller.event.currency)}
    />
  )

  // An ended event has nothing left to buy: the bar leads with what is left to review, or goes.
  const ended = controller.list.ended
  if (ended && review === 0) return null

  return (
    <div
      className={cn(
        "sticky z-30 flex justify-end",
        // Phone: above the mobile bottom navigation, clear of the floating action button.
        kind === "bar"
          ? "bottom-[calc(var(--mobile-nav-height)+1rem)] mr-14"
          : "bottom-4"
      )}
    >
      <button
        // The shared floating bar surface, readable over any page content in both themes.
        className={cn(
          FLOATING_BAR_SURFACE,
          "flex min-h-12 flex-wrap items-center gap-x-2 interactive-surface px-4 py-2 text-sm font-semibold"
        )}
        data-testid={
          kind === "button"
            ? "event-shop-list-button"
            : "event-shop-still-to-buy-bar"
        }
        onClick={onActivate}
        type="button"
      >
        {ended ? null : icon}
        <span>
          {ended
            ? t("list.title")
            : kind === "button"
              ? t("list.button", { amount })
              : t("list.stillToBuyBar", { amount })}
        </span>
        {review > 0 ? (
          <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-amber-950">
            {t("list.toReview", { count: review })}
          </span>
        ) : null}
      </button>
    </div>
  )
}
