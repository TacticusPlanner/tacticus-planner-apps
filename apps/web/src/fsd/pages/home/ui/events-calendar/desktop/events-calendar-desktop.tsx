import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { parseLocalDate, toIsoDate } from "../../../model/events-calendar-calc"
import type {
  EventLane,
  EventsCalendarDay,
} from "../../../model/events-calendar.types"
import { EventEntryCard } from "../event-entry-card"

// A Gantt-style grid, not a day-column grid: a header row of day labels, then one row per lane, each
// entry positioned as a colored bar spanning the day-columns it covers — matches the reference
// calendars' layout (one horizontal bar per event, stacked into as few rows as overlaps require) rather
// than stacking every day's events into its own column.
export function EventsCalendarDesktop({
  days,
  lanes,
}: {
  days: EventsCalendarDay[]
  lanes: EventLane[]
}) {
  const { i18n } = useTranslation()
  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.resolvedLanguage, { weekday: "short" }),
    [i18n.resolvedLanguage]
  )
  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(i18n.resolvedLanguage, { day: "numeric" }),
    [i18n.resolvedLanguage]
  )
  const todayIso = toIsoDate(new Date())

  return (
    <div className="flex flex-col gap-1" data-testid="events-calendar-desktop">
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const date = parseLocalDate(day.date)
          const isToday = day.date === todayIso

          return (
            <div
              className="flex items-baseline justify-between px-1 text-xs text-muted-foreground data-[today=true]:font-semibold data-[today=true]:text-primary"
              data-testid="events-calendar-day-header"
              data-today={isToday}
              key={day.date}
            >
              <span>{weekdayFormatter.format(date)}</span>
              <span className="font-medium text-foreground data-[today=true]:text-primary">
                {dayFormatter.format(date)}
              </span>
            </div>
          )
        })}
      </div>
      <div
        className="flex flex-col gap-1.5"
        data-testid="events-calendar-lanes"
      >
        {lanes.map((lane, laneIndex) => (
          <div className="grid h-9 grid-cols-7 gap-2" key={laneIndex}>
            {lane.entries.map((entry) => (
              <div
                className="min-w-0"
                key={entry.key}
                style={{
                  gridColumn: `${entry.startColumn} / span ${entry.span}`,
                }}
              >
                <EventEntryCard entry={entry} variant="bar" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
