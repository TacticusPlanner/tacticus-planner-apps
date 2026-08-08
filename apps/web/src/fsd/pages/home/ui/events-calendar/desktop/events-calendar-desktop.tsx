import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { parseLocalDate, toIsoDate } from "../../../model/events-calendar-calc"
import type { EventsCalendarDay } from "../../../model/events-calendar.types"
import { EventEntryCard } from "../event-entry-card"

export function EventsCalendarDesktop({ days }: { days: EventsCalendarDay[] }) {
  const { i18n } = useTranslation()
  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.resolvedLanguage, { weekday: "short" }),
    [i18n.resolvedLanguage]
  )
  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.resolvedLanguage, { day: "numeric" }),
    [i18n.resolvedLanguage]
  )

  return (
    <div
      className="grid grid-cols-7 gap-2"
      data-testid="events-calendar-desktop"
    >
      {days.map((day) => {
        const date = parseLocalDate(day.date)
        const isToday = day.date === toIsoDate(new Date())

        return (
          <div
            className="flex min-h-32 min-w-0 flex-col gap-2 rounded-lg border p-2 data-[today=true]:border-primary"
            data-testid="events-calendar-day-column"
            data-today={isToday}
            key={day.date}
          >
            <div className="flex items-baseline justify-between text-xs text-muted-foreground">
              <span>{weekdayFormatter.format(date)}</span>
              <span className="font-medium text-foreground">
                {dayFormatter.format(date)}
              </span>
            </div>
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
