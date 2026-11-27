import { useTranslation } from "react-i18next"
import {
  compareEventShopsByStart,
  eventDay,
  eventDayIndex,
  eventStatus,
  isDatedEventShop,
} from "@workspace/game-catalog"
import type { GameCatalogEventShopRecord } from "@workspace/game-catalog"

import { EventInstanceSwitcher } from "@/shared/ui"

import {
  eventShopStatusLabel,
  useEventShopName,
} from "../../model/event-shop/event-shop-name"
import type { EventShopFormat } from "../../model/event-shop/use-event-shop-format"

type EventShopInstance = {
  key: string
  status: "running" | "upcoming" | "past"
  shop: GameCatalogEventShopRecord
}

/** The event picker: the shared event switcher (ui-style-guide rule 2), a select grouped Running /
 *  Upcoming / Past between Previous / Next. Each option shows the event's name, dates and status,
 *  or "Start date TBA" for an event with no start date yet (listed last, under Upcoming). */
export function EventShopPicker({
  events,
  value,
  now,
  compact,
  format,
  onSelectEvent,
}: {
  events: readonly GameCatalogEventShopRecord[]
  value: string
  now: number
  /** Phone: the short month, so the name fits. */
  compact: boolean
  format: EventShopFormat
  onSelectEvent: (eventId: string) => void
}) {
  const { t } = useTranslation("eventShops")
  const eventName = useEventShopName({ short: compact })
  const instances: EventShopInstance[] = events
    .toSorted(compareEventShopsByStart)
    .map((shop) => {
      const status = isDatedEventShop(shop) ? eventStatus(shop, now) : null
      return {
        key: shop.id,
        status:
          status === "running"
            ? "running"
            : status === "ended"
              ? "past"
              : "upcoming",
        shop,
      }
    })
  const details = (shop: GameCatalogEventShopRecord) =>
    isDatedEventShop(shop)
      ? `${t("header.dates", {
          start: format.date(eventDay(shop, 0).date),
          end: format.date(eventDay(shop, shop.dayCount - 1).date),
          count: shop.dayCount,
        })} · ${eventShopStatusLabel(t, eventStatus(shop, now), eventDayIndex(shop, now))}`
      : t("header.tba")

  return (
    <EventInstanceSwitcher
      className="min-w-0 md:max-w-120"
      instances={instances}
      labels={{
        label: t("header.picker"),
        placeholder: t("header.switcher.placeholder"),
        empty: t("header.switcher.empty"),
        previous: t("header.switcher.previous"),
        next: t("header.switcher.next"),
        groups: {
          running: t("header.switcher.groups.running"),
          upcoming: t("header.switcher.groups.upcoming"),
          past: t("header.switcher.groups.past"),
        },
      }}
      onSelect={onSelectEvent}
      renderOption={({ shop }) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{eventName(shop)}</span>
          <span className="text-xs text-muted-foreground in-data-[slot=select-value]:hidden">
            {details(shop)}
          </span>
        </span>
      )}
      selectedKey={value}
      testIdPrefix="event-shop-picker"
    />
  )
}
