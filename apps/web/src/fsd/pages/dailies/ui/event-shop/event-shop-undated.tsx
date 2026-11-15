import { useTranslation } from "react-i18next"
import type { GameCatalogEventShopRecord } from "@workspace/game-catalog"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"

import { EntityIcon } from "@/shared/ui"

import { EventShopPicker } from "./event-shop-picker"
import type { EventShopForm } from "../../model/event-shop-route"
import { useEventShopFormat } from "./use-event-shop-format"

/**
 * An event shop the game data already has but whose start date is not announced yet: the picker, a
 * "Start date TBA" badge and what is known (weeks, currency). Days and the cart need the start date
 * (which slot sells on which day follows the weekday), so they open once the event is dated.
 */
export function EventShopUndated({
  event,
  events,
  form,
  now,
  onSelectEvent,
}: {
  event: GameCatalogEventShopRecord
  events: readonly GameCatalogEventShopRecord[]
  form: EventShopForm
  now: number
  onSelectEvent: (eventId: string) => void
}) {
  const { t } = useTranslation("eventShops")
  const format = useEventShopFormat()
  const currency = format.currencyIcon(event.currency)

  return (
    <div
      className="flex flex-col gap-4"
      data-testid={`event-shop-undated-${form}`}
    >
      <header className="flex flex-col gap-2" data-testid="event-shop-header">
        <div className="flex flex-wrap items-center gap-2">
          <EventShopPicker
            compact={form === "phone"}
            events={events}
            format={format}
            now={now}
            onSelectEvent={onSelectEvent}
            value={event.id}
          />
          <Badge data-testid="event-shop-status" variant="secondary">
            {t("header.tba")}
          </Badge>
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{t("undated.weeks", { count: event.weeks.length })}</span>
          <span className="inline-flex items-center gap-1">
            <EntityIcon alt="" className="size-4" src={currency} />
            {format.reward(event.currency).label}
          </span>
        </p>
      </header>
      <Alert data-testid="event-shop-undated">
        <AlertDescription>{t("undated.description")}</AlertDescription>
      </Alert>
    </div>
  )
}
