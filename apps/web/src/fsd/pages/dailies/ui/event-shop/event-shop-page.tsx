import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Navigate,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router"
import type { GameCatalogEventShop } from "@workspace/game-catalog"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { useMinuteNow } from "@/entities/legendary-event"
import { useCatalogDataset } from "@/shared/local-data"

import {
  defaultEventId,
  normalizeEventShopTab,
  parseEventShopDay,
  type EventShopTab,
} from "../../model/event-shop-route"
import type { DailiesOutletContext } from "../dailies-layout"
import { EventShopView } from "./event-shop-view"
import { useEventShopController } from "./use-event-shop-controller"
import { useEventShopForm } from "./use-event-shop-form"

const BASE = "/dailies/event-shop"

const byStart = (events: GameCatalogEventShop[]) =>
  [...events].sort((a, b) => Date.parse(a.startUtc) - Date.parse(b.startUtc))

/** Router state carried by the redirect from an unknown event id. */
type RedirectState = { notFound?: boolean } | null

/**
 * Dailies › Event shop (spec event-shop-planner). `/dailies/event-shop` and an unknown event id
 * redirect to the default event; the event shows in its desktop, tablet or phone form with `?day=`
 * and `?tab=` in the URL.
 */
const DAY_MS = 86_400_000

export function EventShopPage() {
  const { t } = useTranslation("eventShops")
  const { eventId } = useParams()
  const location = useLocation()
  const read = useCatalogDataset("event-shops", byStart)
  // One instant for the whole page, so every part agrees on "today". It moves on at the 00:00 UTC shop
  // reset (to that midnight), so a page left open overnight shows the new day.
  const [openedAt] = useState(() => Date.now())
  const utcDay = useMinuteNow((ms) => Math.floor(ms / DAY_MS))
  const now = Math.max(openedAt, utcDay * DAY_MS)

  if (read.status === "loading") {
    return (
      <div className="flex flex-col gap-3" data-testid="event-shop-loading">
        <Skeleton className="h-9 w-80" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (read.status === "error") {
    return (
      <Alert data-testid="event-shop-error" variant="destructive">
        <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
          <span>{t("states.error")}</span>
          <Button onClick={read.retry} size="sm" variant="outline">
            {t("states.retry")}
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const events = read.data
  if (events.length === 0) {
    return (
      <div
        className="flex flex-col gap-1 py-12 text-center"
        data-testid="event-shop-empty"
      >
        <p className="text-lg font-semibold">{t("states.empty")}</p>
        <p className="text-sm text-muted-foreground">
          {t("states.emptyDescription")}
        </p>
      </div>
    )
  }

  const event = events.find((candidate) => candidate.id === eventId)
  if (!event) {
    const fallback = defaultEventId(events, now)!
    return (
      <Navigate
        replace
        state={eventId ? ({ notFound: true } satisfies RedirectState) : null}
        to={`${BASE}/${fallback}${location.search}`}
      />
    )
  }

  return (
    <EventShopEvent
      key={event.id}
      event={event}
      events={events}
      notFound={(location.state as RedirectState)?.notFound === true}
      now={now}
    />
  )
}

function EventShopEvent({
  event,
  events,
  notFound,
  now,
}: {
  event: GameCatalogEventShop
  events: readonly GameCatalogEventShop[]
  notFound: boolean
  now: number
}) {
  const { t } = useTranslation("eventShops")
  const context = useOutletContext<DailiesOutletContext>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const form = useEventShopForm()
  const tab = normalizeEventShopTab(searchParams.get("tab"), form)
  const day = parseEventShopDay(searchParams.get("day"), event.dayCount)
  const controller = useEventShopController(event, day, now)
  const [showNotFound, setShowNotFound] = useState(notFound)

  const update = useMemo(
    () => (changes: Record<string, string | null>) =>
      setSearchParams((current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) {
          if (value === null) next.delete(key)
          else next.set(key, value)
        }
        return next
      }),
    [setSearchParams]
  )

  return (
    <div className="flex flex-col gap-3">
      {showNotFound ? (
        <Alert data-testid="event-shop-not-found">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>{t("states.notFound")}</span>
            <Button
              onClick={() => setShowNotFound(false)}
              size="sm"
              variant="ghost"
            >
              {t("states.dismiss")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <EventShopView
        context={context}
        controller={controller}
        events={events}
        form={form}
        onGoToDay={(dayIndex) => update({ day: String(dayIndex), tab: "shop" })}
        onSelectDay={(dayIndex) => update({ day: String(dayIndex) })}
        onSelectEvent={(id) => {
          // Changing the event drops the day and keeps the tab.
          const next = new URLSearchParams(searchParams)
          next.delete("day")
          const query = next.toString()
          void navigate(`${BASE}/${id}${query ? `?${query}` : ""}`)
        }}
        onSelectTab={(value: EventShopTab) => update({ tab: value })}
        tab={tab}
      />
    </div>
  )
}
