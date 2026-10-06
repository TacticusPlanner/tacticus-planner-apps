import { Link } from "react-router"
import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EventTimingLines } from "../shared/event-timing-lines"
import type { HubCardViewModel } from "./legendary-events-hub.view-model"

/** One hub row: portrait, localized name and timing, plus the synced run, tokens and points for
 *  the active event. Activating it opens the event page. */
export function LegendaryEventCard({
  card,
  nowMs,
  testId,
}: {
  card: HubCardViewModel
  nowMs: number
  testId?: string
}) {
  const { t, i18n } = useTranslation("legendaryEvents")
  const number = new Intl.NumberFormat(i18n.language)
  const portrait = characterIcon(card.eventId as UnitId)
  const { synced } = card

  return (
    <Link
      className={cn(
        "flex min-w-0 items-start gap-3 rounded-xl border bg-card p-3 text-card-foreground transition-colors",
        "border-l-4 border-l-(--event-legendary) hover:bg-muted/50",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
      )}
      data-state={card.lifecycle.state}
      data-testid={testId ?? "legendary-event-card"}
      to={`/events/legendary-events/${card.eventId}`}
    >
      {portrait ? (
        <img
          alt=""
          aria-hidden="true"
          className="size-12 shrink-0 rounded-full object-cover"
          src={portrait}
        />
      ) : (
        <span
          aria-hidden="true"
          className="size-12 shrink-0 rounded-full bg-muted"
        />
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <p
          className="truncate font-semibold"
          data-testid="legendary-event-name"
        >
          {card.name}
        </p>
        <EventTimingLines lifecycle={card.lifecycle} nowMs={nowMs} />
        {synced.kind === "unavailable" ? (
          <p
            className="text-sm text-muted-foreground"
            data-testid="legendary-event-synced-unavailable"
          >
            {t("hub.syncedUnavailable")}
          </p>
        ) : null}
        {synced.kind === "entry" ? (
          <p
            className="flex flex-wrap gap-x-3 text-sm"
            data-testid="legendary-event-synced"
          >
            {synced.run === null ? null : (
              <span>{t("run", { run: synced.run })}</span>
            )}
            {synced.tokens ? (
              <span>
                {t("tokens", {
                  current: synced.tokens.current,
                  max: synced.tokens.max,
                })}
              </span>
            ) : null}
            <span>{t("points", { points: number.format(synced.points) })}</span>
          </p>
        ) : null}
      </div>
    </Link>
  )
}
