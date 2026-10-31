import { useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"

import type {
  EventsCalendarView,
  EventsCalendarViewModel,
} from "../../model/events-calendar.types"
import { getDeviceLocale } from "@/shared/lib"

const VIEWS: readonly EventsCalendarView[] = ["week", "month"]

function isView(value: string): value is EventsCalendarView {
  return (VIEWS as readonly string[]).includes(value)
}

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
  const rangeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(getDeviceLocale(), {
        month: "short",
        day: "numeric",
      }),
    []
  )
  const monthFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(getDeviceLocale(), {
        month: "long",
        year: "numeric",
      }),
    []
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
        <Button onClick={calendar.goToToday} size="sm" variant="ghost">
          {t("navigation.today")}
        </Button>
      </div>
      <ToggleGroup
        aria-label={t("navigation.view")}
        onValueChange={(value) => {
          if (isView(value)) calendar.setView(value)
        }}
        size="sm"
        type="single"
        value={calendar.view}
        variant="outline"
      >
        {VIEWS.map((view) => (
          <ToggleGroupItem key={view} value={view}>
            {t(`navigation.views.${view}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
