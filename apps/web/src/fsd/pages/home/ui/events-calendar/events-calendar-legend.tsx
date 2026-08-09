import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import {
  EVENT_COLOR_KEYS_IN_LEGEND_ORDER,
  eventBarClass,
  resolveEventColorKey,
  type EventColorKey,
} from "../../model/event-colors"
import type { EventsCalendarDay } from "../../model/events-calendar.types"

/** Only the color keys actually present this week — keeps the legend as compact as the reference calendars'. */
function collectVisibleColorKeys(
  days: EventsCalendarDay[]
): Set<EventColorKey> {
  const keys = new Set<EventColorKey>()
  for (const day of days) {
    for (const entry of day.entries) {
      keys.add(resolveEventColorKey(entry.definitionId, entry.definitionType))
    }
  }
  return keys
}

export function EventsCalendarLegend({ days }: { days: EventsCalendarDay[] }) {
  const { t } = useTranslation("events")
  const visibleKeys = useMemo(() => collectVisibleColorKeys(days), [days])
  const orderedKeys = EVENT_COLOR_KEYS_IN_LEGEND_ORDER.filter((key) =>
    visibleKeys.has(key)
  )

  if (orderedKeys.length === 0) {
    return null
  }

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5"
      data-testid="events-calendar-legend"
    >
      {orderedKeys.map((key) => (
        <div className="flex items-center gap-1.5" key={key}>
          <span
            aria-hidden="true"
            className={cn("size-2.5 shrink-0 rounded-sm", eventBarClass(key))}
          />
          <span className="text-xs text-muted-foreground">
            {t(`legend.${key}`)}
          </span>
        </div>
      ))}
    </div>
  )
}
