import { useTranslation } from "react-i18next"
import {
  compareEventShopsByStart,
  eventDay,
  eventDayIndex,
  eventStatus,
  isDatedEventShop,
  type GameCatalogEventShopRecord,
} from "@workspace/game-catalog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { eventShopStatusLabel, useEventShopName } from "./event-shop-name"
import type { EventShopFormat } from "./use-event-shop-format"

/** The event picker: newest first (events with no start date yet on top), each with its dates and
 *  status, or "Start date TBA". */
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
  const newestFirst = [...events].sort((a, b) => compareEventShopsByStart(b, a))
  const details = (shop: GameCatalogEventShopRecord) =>
    isDatedEventShop(shop)
      ? `${t("header.dates", {
          start: format.date(eventDay(shop, 0).date),
          end: format.date(eventDay(shop, shop.dayCount - 1).date),
          count: shop.dayCount,
        })} · ${eventShopStatusLabel(t, eventStatus(shop, now), eventDayIndex(shop, now))}`
      : t("header.tba")

  return (
    <Select onValueChange={onSelectEvent} value={value}>
      <SelectTrigger
        aria-label={t("header.picker")}
        className="min-w-0 flex-1 text-base font-semibold md:max-w-96 pointer-coarse:h-10"
        data-testid="event-shop-picker"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        {newestFirst.map((shop) => (
          <SelectItem
            key={shop.id}
            data-testid={`event-shop-picker-option-${shop.id}`}
            value={shop.id}
          >
            <span className="flex flex-col">
              <span>{eventName(shop)}</span>
              <span className="text-xs text-muted-foreground in-data-[slot=select-value]:hidden">
                {details(shop)}
              </span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
