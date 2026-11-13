import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { eventDay, resolveEventDaySlots } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"

import { withoutFreebies } from "@/features/shops/event-planner"
import { EntityIcon } from "@/shared/ui"

import { CartControls, Cost, PacksSlider } from "./event-shop-slots"
import { slotViews, useSlotLabelText, type SlotView } from "./slot-view"
import type { EventShopController } from "./use-event-shop-controller"
import type { EventShopFormat } from "./use-event-shop-format"

/** The other days, from today on, on which the event sells `rewardType`. */
function useAlsoDays(
  controller: EventShopController,
  rewardType: string | null
) {
  const { event, selectedDay, todayIndex, roster, now } = controller
  return useMemo(() => {
    if (!rewardType) return []
    const days: string[] = []
    for (let index = Math.max(0, todayIndex); index < event.dayCount; index++) {
      if (index === selectedDay.index) continue
      // The daily freebie's gold is not a gold offer, so it never counts as "also on sale".
      const sells = withoutFreebies(
        event,
        resolveEventDaySlots(event, index, {
          lockContext: roster.lockContext ?? undefined,
          powerLevel: roster.powerLevel,
          now,
        })
      ).some((slot) =>
        slot.offers.some((offer) => offer.rewardType === rewardType)
      )
      if (sells) days.push(eventDay(event, index).date)
    }
    return days
  }, [event, selectedDay.index, todayIndex, roster, now, rewardType])
}

/**
 * A slot not in the cart yet: the packs slider starts at the day's max, and "Add N to cart" plans that
 * many and closes the sheet (the tile's tick then marks them bought).
 */
function AddAtAmount({
  controller,
  format,
  view,
  onAdded,
}: {
  controller: EventShopController
  format: EventShopFormat
  view: SlotView
  onAdded: () => void
}) {
  const { t } = useTranslation("eventShops")
  const cap = view.offer.maxPerDay
  const [amount, setAmount] = useState(cap)
  const disabled = !controller.cartReady
  return (
    <div className="flex flex-col gap-3 border-t pt-3">
      {cap > 1 ? (
        <PacksSlider
          cap={cap}
          disabled={disabled}
          large
          onChange={setAmount}
          slotIndex={view.ref.slotIndex}
          value={amount}
        />
      ) : null}
      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        {t("slot.lineTotal", {
          count: amount,
          cost: format.number(view.offer.cost.amount),
        })}
        <Cost
          amount={amount * view.offer.cost.amount}
          className="font-semibold text-foreground"
          currency={controller.event.currency}
          format={format}
        />
      </span>
      <Button
        data-testid={`event-shop-sheet-add-${view.ref.slotIndex}`}
        disabled={disabled}
        onClick={() => {
          controller.add(view.ref, view.offer, amount)
          onAdded()
        }}
        size="lg"
      >
        {t("slot.addAmount", { count: amount })}
      </Button>
    </div>
  )
}

/** Phone: a slot's cart controls in a bottom sheet. */
export function SlotSheet({
  controller,
  format,
  slotIndex,
  onClose,
}: {
  controller: EventShopController
  format: EventShopFormat
  slotIndex: number | null
  onClose: () => void
}) {
  const { t } = useTranslation("eventShops")
  const labelText = useSlotLabelText()
  const view =
    slotIndex === null
      ? null
      : (slotViews(controller).find(
          (candidate) => candidate.ref.slotIndex === slotIndex
        ) ?? null)
  const also = useAlsoDays(
    controller,
    view && !view.freebie ? view.offer.rewardType : null
  )
  const { selectedDay, todayIndex } = controller
  const date = format.date(selectedDay.date)
  const reward = view
    ? format.reward(view.shown.rewardType, view.shown.unitId)
    : null

  return (
    <Drawer open={view !== null} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent data-testid="event-shop-slot-sheet">
        {view && reward ? (
          <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 pb-6">
            <DrawerHeader className="flex-row items-center gap-3 px-0 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
              <EntityIcon
                alt=""
                className="size-14 shrink-0"
                src={reward.iconUrl}
              />
              <div className="min-w-0">
                <DrawerTitle>{reward.label}</DrawerTitle>
                <DrawerDescription>
                  {t("slot.sheetSubtitle", {
                    number: view.ref.slotIndex + 1,
                    date:
                      selectedDay.index === todayIndex
                        ? t("days.selectedToday", { day: date })
                        : date,
                  })}
                </DrawerDescription>
                {labelText(view.label) ? (
                  <p className="text-xs text-muted-foreground">
                    {labelText(view.label)}
                  </p>
                ) : null}
              </div>
            </DrawerHeader>
            {view.options.length > 1 ? (
              <ul className="flex flex-col gap-2">
                {view.options.map((option) => {
                  const optionReward = format.reward(
                    option.rewardType,
                    option.unitId
                  )
                  const planned =
                    view.entry?.entry.rewardType === option.rewardType
                  return (
                    <li
                      key={option.rewardType}
                      className="flex items-center gap-2"
                    >
                      <EntityIcon
                        alt=""
                        className="size-8"
                        src={optionReward.iconUrl}
                      />
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block">{optionReward.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {t("slot.pack", {
                            qty: format.number(option.rewardQty),
                          })}{" "}
                          ·{" "}
                          <Cost
                            amount={option.cost.amount}
                            currency={controller.event.currency}
                            format={format}
                          />
                        </span>
                      </span>
                      {view.freebieOf(option.rewardType) ? (
                        <span className="shrink-0 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          {t("slot.freebieShort")}
                        </span>
                      ) : planned ? null : (
                        <Button
                          disabled={!controller.cartReady}
                          onClick={() => controller.add(view.ref, option)}
                          size="sm"
                          variant="outline"
                        >
                          {t("slot.add")}
                        </Button>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : view.freebie ? (
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                {t("slot.pack", { qty: format.number(view.shown.qty) })} ·{" "}
                {t("slot.freebieShort")}
              </p>
            ) : (
              <p className="flex flex-wrap items-center gap-1 text-sm">
                {t("slot.pack", { qty: format.number(view.offer.rewardQty) })} ·{" "}
                {t("slot.costCap", {
                  cost: format.number(view.offer.cost.amount),
                  cap: view.offer.maxPerDay,
                })}
              </p>
            )}
            {also.length > 0 ? (
              <p
                className="text-sm text-muted-foreground"
                data-testid="event-shop-sheet-also"
              >
                {t("slot.also", { days: also.map(format.date).join(", ") })}
              </p>
            ) : null}
            {view.entry ? (
              <CartControls
                controller={controller}
                format={format}
                view={view}
              />
            ) : view.freebie ? (
              <p
                className="border-t pt-3 text-sm text-muted-foreground"
                data-testid="event-shop-sheet-freebie"
              >
                {t("slot.claimInGame")}
              </p>
            ) : view.options.length === 1 ? (
              <AddAtAmount
                key={`${view.ref.slotIndex}/${view.offer.rewardType}`}
                controller={controller}
                format={format}
                onAdded={onClose}
                view={view}
              />
            ) : null}
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}
