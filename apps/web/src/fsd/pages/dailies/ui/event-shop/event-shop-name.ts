import { useTranslation } from "react-i18next"
import type {
  EventShopStatus,
  GameCatalogEventShopRecord,
} from "@workspace/game-catalog"

import { dateTimeFormat } from "@/shared/lib"

import { eventKeyMonthUtc } from "./event-shop-name.model"

/** "Armageddon Shop · October 2026": the calendar definition's name and the start month ("Oct 2026"
 *  when `short`, so the name fits a phone's picker). An event with no start date yet has no definition:
 *  it takes the game's own event name and the month of its event key ("Machine Spirit Resurgent ·
 *  December 2026"). */
export function useEventShopName({ short = false }: { short?: boolean } = {}) {
  const { t, i18n } = useTranslation(["eventShops", "events", "eventMissions"])
  const month = dateTimeFormat(i18n.language, {
    month: short ? "short" : "long",
    year: "numeric",
    timeZone: "UTC",
  })
  return (
    event: Pick<
      GameCatalogEventShopRecord,
      "definitionId" | "startUtc" | "eventKey"
    >
  ) => {
    const name =
      event.definitionId === null
        ? t(`eventMissions:events.${event.eventKey}` as never, {
            defaultValue: event.eventKey,
          })
        : t(`events:definitions.${event.definitionId}` as never, {
            defaultValue: event.definitionId,
          })
    const start =
      event.startUtc === null
        ? eventKeyMonthUtc(event.eventKey)
        : Date.parse(event.startUtc)
    return start === null
      ? name
      : t("eventShops:header.name", { name, month: month.format(start) })
  }
}

/** "Starts in 3 days", "Running" or "Ended". */
export function eventShopStatusLabel(
  t: ReturnType<typeof useTranslation<"eventShops">>["t"],
  status: EventShopStatus,
  todayIndex: number
) {
  if (status === "upcoming") {
    return t("header.status.upcoming", { count: Math.max(1, -todayIndex) })
  }
  return t(`header.status.${status}`)
}

/** The local time of the daily 00:00 UTC shop reset, on the day of `now` (so DST is right). */
export function localResetTime(
  now: number,
  language: string,
  timeZone?: string
) {
  const today = new Date(now)
  const reset = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  )
  return dateTimeFormat(language, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(reset)
}
