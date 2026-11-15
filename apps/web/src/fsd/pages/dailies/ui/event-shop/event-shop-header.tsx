import { useTranslation } from "react-i18next"
import { Search } from "lucide-react"
import {
  eventDay,
  eventDayIndex,
  eventStatus,
  type GameCatalogEventShop,
} from "@workspace/game-catalog"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { formatRelativeTime } from "@/shared/lib"
import { EntityIcon } from "@/shared/ui"

import { localResetTime, useEventShopName } from "./event-shop-name"
import type { EventShopController } from "./use-event-shop-controller"
import type { EventShopFormat } from "./use-event-shop-format"

/**
 * The event picker (newest first, with date ranges), the status badge, dates and day count, the daily
 * reset in the user's time zone, the last player-data sync and the selected week's estimated income.
 */
export function EventShopHeader({
  controller,
  events,
  onSelectEvent,
  onOpenSearch,
  format,
}: {
  controller: EventShopController
  events: readonly GameCatalogEventShop[]
  onSelectEvent: (eventId: string) => void
  /** Phone: the unit shard search opens from a header icon. */
  onOpenSearch?: () => void
  format: EventShopFormat
}) {
  const { t, i18n } = useTranslation("eventShops")
  // Phone: the search opens from the header, the picker gets the row and the status the dates line.
  const compact = onOpenSearch !== undefined
  const eventName = useEventShopName({ short: compact })
  const { event, now, status, todayIndex, selectedDay, roster } = controller
  const newestFirst = [...events].sort(
    (a, b) => Date.parse(b.startUtc) - Date.parse(a.startUtc)
  )
  const dates = (shop: GameCatalogEventShop) =>
    t("header.dates", {
      start: format.date(eventDay(shop, 0).date),
      end: format.date(eventDay(shop, shop.dayCount - 1).date),
      count: shop.dayCount,
    })
  const income = event.weeks.find(
    (week) => week.week === selectedDay.week
  )?.estimatedWeeklyIncome
  const currency = format.currencyIcon(event.currency)
  const statusBadge = (
    <Badge
      data-testid="event-shop-status"
      variant={status === "running" ? "default" : "secondary"}
    >
      {statusLabel(t, status, todayIndex)}
    </Badge>
  )

  return (
    <header className="flex flex-col gap-2" data-testid="event-shop-header">
      <div className="flex flex-wrap items-center gap-2">
        <Select onValueChange={onSelectEvent} value={event.id}>
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
                    {dates(shop)}
                    {" · "}
                    {statusLabel(
                      t,
                      eventStatus(shop, now),
                      eventDayIndex(shop, now)
                    )}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {compact ? null : statusBadge}
        {onOpenSearch ? (
          <Button
            aria-label={t("header.search")}
            className="ml-auto pointer-coarse:size-12"
            data-testid="event-shop-search-open"
            onClick={onOpenSearch}
            size="icon"
            variant="outline"
          >
            <Search aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        {compact ? statusBadge : null}
        <span data-testid="event-shop-dates">{dates(event)}</span>
        <span data-testid="event-shop-reset">
          {t("header.reset", { time: localResetTime(now, i18n.language) })}
        </span>
        <span data-testid="event-shop-synced">
          {roster.lastSyncedAt
            ? t("header.synced", {
                time: formatRelativeTime(
                  Date.parse(roster.lastSyncedAt),
                  i18n.language
                ),
              })
            : t("header.notSynced")}
        </span>
        {income ? (
          <span
            className="inline-flex items-center gap-1"
            data-testid="event-shop-income"
          >
            <EntityIcon alt="" className="size-4" src={currency} />
            {t("header.income", {
              free: format.number(income.free),
              bonus: format.number(income.bonusShipment),
            })}
          </span>
        ) : null}
      </p>
    </header>
  )
}

function statusLabel(
  t: ReturnType<typeof useTranslation<"eventShops">>["t"],
  status: ReturnType<typeof eventStatus>,
  todayIndex: number
) {
  if (status === "upcoming") {
    return t("header.status.upcoming", { count: Math.max(1, -todayIndex) })
  }
  return t(`header.status.${status}`)
}
