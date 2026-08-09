import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { parseLocalDate, toIsoDate } from "../../../model/events-calendar-calc"
import type { EventsCalendarDay } from "../../../model/events-calendar.types"
import { EventEntryCard } from "../event-entry-card"

// Stacked day sections rather than desktop's 7-column grid — a week-wide grid doesn't fit a phone
// viewport, and only days that actually have events are rendered, for a compact, scannable list.
export function EventsCalendarMobile({ days }: { days: EventsCalendarDay[] }) {
  const { t, i18n } = useTranslation("events")
  const dayHeaderFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.resolvedLanguage, {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
    [i18n.resolvedLanguage]
  )
  const daysWithEntries = days.filter((day) => day.entries.length > 0)

  if (daysWithEntries.length === 0) {
    return (
      <p
        className="py-6 text-center text-sm text-muted-foreground"
        data-testid="events-calendar-mobile-empty"
      >
        {t("states.empty")}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4" data-testid="events-calendar-mobile">
      {daysWithEntries.map((day) => {
        const date = parseLocalDate(day.date)
        const isToday = day.date === toIsoDate(new Date())

        return (
          <div data-testid="events-calendar-day-section" key={day.date}>
            <h3
              className="mb-2 text-sm font-medium data-[today=true]:text-primary"
              data-today={isToday}
            >
              {dayHeaderFormatter.format(date)}
            </h3>
            <div className="flex flex-col gap-1">
              {day.entries.map((entry) => (
                <EventEntryCard entry={entry} key={entry.key} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
