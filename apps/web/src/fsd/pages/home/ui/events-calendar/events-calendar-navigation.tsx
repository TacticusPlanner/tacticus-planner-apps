import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import type { EventsCalendarViewModel } from "../../model/events-calendar.types"

const rangeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
})

export function EventsCalendarNavigation({
  calendar,
}: {
  calendar: Pick<
    EventsCalendarViewModel,
    | "rangeStart"
    | "rangeEnd"
    | "goToPreviousWeek"
    | "goToNextWeek"
    | "goToToday"
  >
}) {
  const { t } = useTranslation("events")
  const lastVisibleDay = new Date(calendar.rangeEnd.getTime() - 1)

  return (
    <div
      className="flex items-center justify-between gap-2"
      data-testid="events-calendar-navigation"
    >
      <Button
        aria-label={t("navigation.previousWeek")}
        data-testid="events-calendar-previous-week"
        onClick={calendar.goToPreviousWeek}
        size="icon"
        variant="outline"
      >
        <ChevronLeft />
      </Button>
      <div className="flex items-center gap-2">
        <span
          className="text-sm font-medium"
          data-testid="events-calendar-range-label"
        >
          {rangeFormatter.formatRange(calendar.rangeStart, lastVisibleDay)}
        </span>
        <Button onClick={calendar.goToToday} size="sm" variant="ghost">
          {t("navigation.today")}
        </Button>
      </div>
      <Button
        aria-label={t("navigation.nextWeek")}
        data-testid="events-calendar-next-week"
        onClick={calendar.goToNextWeek}
        size="icon"
        variant="outline"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
