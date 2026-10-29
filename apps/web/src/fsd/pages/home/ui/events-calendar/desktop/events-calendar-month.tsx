import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { parseLocalDate, toIsoDate } from "../../../model/events-calendar-calc"
import type { EventsCalendarWeek } from "../../../model/events-calendar.types"
import { EventLaneRow } from "./event-lane-row"

// The month as whole Monday-to-Sunday weeks, each row the week view's Gantt lanes in compact form: an
// event running across a week boundary continues as a new bar on the next row. Days outside the month
// stay visible but muted so a week never looks cut short.
export function EventsCalendarMonth({
  month,
  weeks,
}: {
  /** Any date in the viewed month. */
  month: Date
  weeks: EventsCalendarWeek[]
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
  const firstWeek = weeks[0]

  return (
    <div className="flex flex-col" data-testid="events-calendar-month">
      {firstWeek ? (
        <div className="grid grid-cols-7 gap-2 pb-1">
          {firstWeek.days.map((day) => (
            <div className="px-1 text-xs text-muted-foreground" key={day.date}>
              {weekdayFormatter.format(parseLocalDate(day.date))}
            </div>
          ))}
        </div>
      ) : null}
      {weeks.map((week) => (
        <div
          className="flex min-h-20 flex-col gap-1 border-t py-1.5"
          data-testid="events-calendar-month-week"
          key={week.days[0]?.date}
        >
          <div className="grid grid-cols-7 gap-2">
            {week.days.map((day) => {
              const date = parseLocalDate(day.date)
              const isToday = day.date === todayIso
              const inMonth = date.getMonth() === month.getMonth()

              return (
                <div
                  className="px-1 text-xs font-medium data-[in-month=false]:text-muted-foreground/60 data-[today=true]:font-semibold data-[today=true]:text-primary"
                  data-in-month={inMonth}
                  data-testid="events-calendar-day-header"
                  data-today={isToday}
                  key={day.date}
                >
                  {dayFormatter.format(date)}
                </div>
              )
            })}
          </div>
          {week.lanes.map((lane, laneIndex) => (
            <EventLaneRow compact key={laneIndex} lane={lane} />
          ))}
        </div>
      ))}
    </div>
  )
}
