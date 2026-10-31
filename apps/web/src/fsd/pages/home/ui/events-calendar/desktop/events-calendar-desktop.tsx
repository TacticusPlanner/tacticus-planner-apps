import { useMemo } from "react"

import { parseLocalDate, toIsoDate } from "../../../model/events-calendar-calc"
import type {
  EventLane,
  EventsCalendarDay,
} from "../../../model/events-calendar.types"
import { EventLaneRow } from "./event-lane-row"
import { getDeviceLocale } from "@/shared/lib"

// A Gantt-style grid, not a day-column grid: a header row of day labels, then one row per lane, each
// entry positioned as a bar spanning the day-columns it covers (one horizontal bar per event, stacked
// into as few rows as overlaps require). The game icon names the event, so a one-day bar is icon-only.
export function EventsCalendarDesktop({
  days,
  lanes,
}: {
  days: EventsCalendarDay[]
  lanes: EventLane[]
}) {
  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(getDeviceLocale(), { weekday: "short" }),
    []
  )
  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(getDeviceLocale(), { day: "numeric" }),
    []
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
          <EventLaneRow key={laneIndex} lane={lane} />
        ))}
      </div>
    </div>
  )
}
