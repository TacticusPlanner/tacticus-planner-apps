import { useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

import type {
  EventsCalendarView,
  EventsCalendarViewModel,
} from "../../model/events-calendar.types"
import { useDateLocale } from "@/shared/lib"
import { SegmentedControl } from "@/shared/ui"

const VIEWS: readonly EventsCalendarView[] = ["week", "month"]

export function EventsCalendarNavigation({
  calendar,
}: {
  calendar: Pick<
    EventsCalendarViewModel,
    | "view"
    | "setView"
    | "rangeStart"
    | "rangeEnd"
    | "goToPrevious"
    | "goToNext"
    | "goToToday"
  >
}) {
  const { t } = useTranslation("events")
  const dateLocale = useDateLocale()
  const rangeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(dateLocale, {
        month: "short",
        day: "numeric",
      }),
    [dateLocale]
  )
  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(dateLocale, {
        month: "long",
        year: "numeric",
      }),
    [dateLocale]
  )
  const lastVisibleDay = new Date(calendar.rangeEnd.getTime() - 1)
  const isMonth = calendar.view === "month"

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2"
      data-testid="events-calendar-navigation"
    >
      <div className="flex items-center gap-2">
        <Button
          aria-label={t(
            isMonth ? "navigation.previousMonth" : "navigation.previousWeek"
          )}
          data-testid="events-calendar-previous"
          onClick={calendar.goToPrevious}
          size="icon"
          variant="outline"
        >
          <ChevronLeft />
        </Button>
        <span
          className="min-w-32 text-center text-sm font-medium"
          data-testid="events-calendar-range-label"
        >
          {isMonth
            ? monthFormatter.format(calendar.rangeStart)
            : rangeFormatter.formatRange(calendar.rangeStart, lastVisibleDay)}
        </span>
        <Button
          aria-label={t(
            isMonth ? "navigation.nextMonth" : "navigation.nextWeek"
          )}
          data-testid="events-calendar-next"
          onClick={calendar.goToNext}
          size="icon"
          variant="outline"
        >
          <ChevronRight />
        </Button>
        <Button onClick={calendar.goToToday} variant="outline">
          {t("navigation.today")}
        </Button>
      </div>
      <SegmentedControl
        label={t("navigation.view")}
        onValueChange={calendar.setView}
        options={VIEWS.map((view) => ({
          value: view,
          label: t(`navigation.views.${view}`),
        }))}
        testId="events-calendar-view"
        value={calendar.view}
      />
    </div>
  )
}
