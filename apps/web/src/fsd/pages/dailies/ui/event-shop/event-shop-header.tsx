import { useTranslation } from "react-i18next"
import { eventDay } from "@workspace/game-catalog"
import type {
  GameCatalogEventShop,
  GameCatalogEventShopRecord,
} from "@workspace/game-catalog"
import { Badge } from "@workspace/ui/components/badge"

import { formatRelativeTime } from "@/shared/lib"
import { EntityIcon, PageToolbar } from "@/shared/ui"

import { eventShopStatusLabel, localResetTime } from "./event-shop-name"
import { EventShopPicker } from "./event-shop-picker"
import { EventShopSearchField } from "./event-shop-search"
import type { EventShopController } from "./use-event-shop-controller"
import type { EventShopFormat } from "./use-event-shop-format"

/**
 * The Event shop's page toolbar (ui-style-guide rule 2). Find: the event picker, then the shop
 * search (on phone it takes the row below the picker). Under the toolbar: the status badge, dates
 * and day count, the daily reset in the user's time zone, the last player-data sync and the
 * selected week's estimated income.
 */
export function EventShopHeader({
  controller,
  events,
  onSelectEvent,
  onOpenDay,
  compact,
  format,
}: {
  controller: EventShopController
  events: readonly GameCatalogEventShopRecord[]
  onSelectEvent: (eventId: string) => void
  /** A search result's day: selects it and opens the Shop tab. */
  onOpenDay: (dayIndex: number) => void
  /** Phone: the short event name in the picker. */
  compact: boolean
  format: EventShopFormat
}) {
  const { t, i18n } = useTranslation("eventShops")
  const { event, now, status, todayIndex, selectedDay, roster } = controller
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

  return (
    <header data-testid="event-shop-header">
      <PageToolbar
        below={
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <Badge
              data-testid="event-shop-status"
              variant={status === "running" ? "default" : "secondary"}
            >
              {eventShopStatusLabel(t, status, todayIndex)}
            </Badge>
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
                <EntityIcon size="icon" alt="" src={currency} />
                {t("header.income", {
                  free: format.number(income.free),
                  bonus: format.number(income.bonusShipment),
                })}
              </span>
            ) : null}
          </p>
        }
        find={
          <>
            <EventShopPicker
              compact={compact}
              events={events}
              format={format}
              now={now}
              onSelectEvent={onSelectEvent}
              value={event.id}
            />
            <EventShopSearchField
              controller={controller}
              format={format}
              onOpenDay={onOpenDay}
            />
          </>
        }
        testId="event-shop-toolbar"
      />
    </header>
  )
}
