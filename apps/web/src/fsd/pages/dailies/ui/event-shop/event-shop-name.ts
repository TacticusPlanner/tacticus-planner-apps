import { useTranslation } from "react-i18next"
import type { GameCatalogEventShop } from "@workspace/game-catalog"

/** "Armageddon Shop · October 2026": the calendar definition's name and the start month ("Oct 2026"
 *  when `short`, so the name fits a phone's picker). */
export function useEventShopName({ short = false }: { short?: boolean } = {}) {
  const { t, i18n } = useTranslation(["eventShops", "events"])
  const month = new Intl.DateTimeFormat(i18n.language, {
    month: short ? "short" : "long",
    year: "numeric",
    timeZone: "UTC",
  })
  return (event: Pick<GameCatalogEventShop, "definitionId" | "startUtc">) =>
    t("eventShops:header.name", {
      name: t(`events:definitions.${event.definitionId}` as never, {
        defaultValue: event.definitionId,
      }),
      month: month.format(new Date(event.startUtc)),
    })
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
  return new Intl.DateTimeFormat(language, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(reset)
}
