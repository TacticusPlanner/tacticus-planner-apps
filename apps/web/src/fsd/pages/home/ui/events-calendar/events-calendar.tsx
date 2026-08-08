import { useIsMobile } from "@workspace/ui/hooks/use-mobile"

import { useEventsCalendar } from "../../model/use-events-calendar"
import { EventsCalendarDesktop } from "./desktop/events-calendar-desktop"
import { EventsCalendarMobile } from "./mobile/events-calendar-mobile"
import { EventsCalendarNavigation } from "./events-calendar-navigation"
import { EventsCalendarState } from "./events-calendar-state"

export function EventsCalendar() {
  const calendar = useEventsCalendar()
  const isMobile = useIsMobile()

  return (
    <div className="flex w-full flex-col gap-4" data-testid="events-calendar">
      <EventsCalendarNavigation calendar={calendar} />
      {calendar.status === "loading" ? (
        <EventsCalendarState state="loading" />
      ) : calendar.status === "error" ? (
        <EventsCalendarState onRetry={calendar.retry} state="error" />
      ) : calendar.status === "empty" && !isMobile ? (
        // Mobile's own layout already renders its empty state per-range (see EventsCalendarMobile);
        // desktop's 7-column grid always renders every day column, so its empty case needs the shared
        // full-width empty state instead of an empty-looking grid.
        <EventsCalendarState state="empty" />
      ) : isMobile ? (
        <EventsCalendarMobile days={calendar.days} />
      ) : (
        <EventsCalendarDesktop days={calendar.days} />
      )}
    </div>
  )
}
