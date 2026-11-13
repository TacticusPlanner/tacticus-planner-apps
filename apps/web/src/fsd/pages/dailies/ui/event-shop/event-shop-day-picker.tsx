import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { eventDays, type EventShopDay } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "@/shared/ui"

import { STATE_DOT, STATE_RING } from "./day-state-style"
import type { EventShopController } from "./use-event-shop-controller"
import type { EventShopFormat } from "./use-event-shop-format"

function useWeek(
  controller: EventShopController,
  onSelectDay: (day: number) => void
) {
  const days = eventDays(controller.event)
  const week = controller.selectedDay.week
  const weekDays = days.filter((day) => day.week === week)
  const lastWeek = days.at(-1)?.week ?? 1
  const position = weekDays.findIndex(
    (day) => day.index === controller.selectedDay.index
  )
  const goWeek = (target: number) => {
    const targetDays = days.filter((day) => day.week === target)
    const day = targetDays[Math.min(position, targetDays.length - 1)]
    if (day) onSelectDay(day.index)
  }
  return {
    weekDays,
    week,
    multiWeek: lastWeek > 1,
    previous: week > 1 ? () => goWeek(week - 1) : null,
    next: week < lastWeek ? () => goWeek(week + 1) : null,
  }
}

function WeekStepper({
  week,
  previous,
  next,
}: {
  week: number
  previous: (() => void) | null
  next: (() => void) | null
}) {
  const { t } = useTranslation("eventShops")
  return (
    <div className="flex items-center gap-1">
      <Button
        aria-label={t("days.previousWeek")}
        data-testid="event-shop-previous-week"
        disabled={!previous}
        onClick={() => previous?.()}
        size="icon-sm"
        variant="ghost"
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <span className="text-sm font-medium">{t("days.week", { week })}</span>
      <Button
        aria-label={t("days.nextWeek")}
        data-testid="event-shop-next-week"
        disabled={!next}
        onClick={() => next?.()}
        size="icon-sm"
        variant="ghost"
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  )
}

function Legend() {
  const { t } = useTranslation("eventShops")
  return (
    <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {(["bought", "toBuy", "needsReview"] as const).map((state) => (
        <li key={state} className="inline-flex items-center gap-1">
          <span className={cn("size-2 rounded-full", STATE_DOT[state])} />
          {t(`days.legend.${state}`)}
        </li>
      ))}
    </ul>
  )
}

/** Desktop and tablet: the selected week's seven days, each listing its planned items by state. */
export function WeekCalendar({
  controller,
  format,
  onSelectDay,
}: {
  controller: EventShopController
  format: EventShopFormat
  onSelectDay: (day: number) => void
}) {
  const { t } = useTranslation("eventShops")
  const { weekDays, week, multiWeek, previous, next } = useWeek(
    controller,
    onSelectDay
  )

  return (
    <section
      aria-label={t("days.label")}
      className="flex flex-col gap-2"
      data-testid="event-shop-week-calendar"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        {multiWeek ? (
          <WeekStepper next={next} previous={previous} week={week} />
        ) : (
          <span />
        )}
        <Legend />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => (
          <CalendarDay
            key={day.index}
            controller={controller}
            day={day}
            format={format}
            onSelect={() => onSelectDay(day.index)}
          />
        ))}
      </div>
    </section>
  )
}

function CalendarDay({
  controller,
  day,
  format,
  onSelect,
}: {
  controller: EventShopController
  day: EventShopDay
  format: EventShopFormat
  onSelect: () => void
}) {
  const { t } = useTranslation("eventShops")
  const state = controller.dayStates[day.index]
  const items = state?.items ?? []
  const selected = day.index === controller.selectedDay.index
  const today = day.index === controller.todayIndex
  const past = day.index < controller.todayIndex

  return (
    <button
      aria-current={today ? "date" : undefined}
      aria-label={`${format.date(day.date)}${today ? ` · ${t("days.today")}` : ""}, ${
        items.length > 0
          ? t("days.planned", { count: items.length })
          : t("days.nothingPlanned")
      }`}
      aria-pressed={selected}
      className={cn(
        "flex min-h-24 flex-col items-stretch gap-1 rounded-md border p-1.5 text-left transition-colors hover:bg-muted/60",
        selected && "border-primary bg-muted",
        past && !selected && "opacity-60"
      )}
      data-testid={`event-shop-day-${day.index}`}
      onClick={onSelect}
      type="button"
    >
      <span className="flex items-baseline justify-between gap-1 text-xs">
        <span className="font-medium">{format.weekday(day.date)}</span>
        <span className="text-muted-foreground">
          {format.dayOfMonth(day.date)}
        </span>
      </span>
      {today ? (
        <span className="text-xs font-semibold text-primary uppercase">
          {t("days.today")}
        </span>
      ) : null}
      <span className="flex flex-wrap gap-1">
        {items.map((item) => {
          const reward = format.reward(item.rewardType)
          return (
            <EntityIcon
              key={`${item.slotIndex}-${item.rewardType}`}
              alt={reward.label}
              className={cn("size-5 rounded-sm ring-2", STATE_RING[item.state])}
              src={reward.iconUrl}
            />
          )
        })}
      </span>
    </button>
  )
}

/** Phone: the week as seven chips with a planned-state dot, and the selected day's label. */
export function DayChips({
  controller,
  format,
  onSelectDay,
}: {
  controller: EventShopController
  format: EventShopFormat
  onSelectDay: (day: number) => void
}) {
  const { t } = useTranslation("eventShops")
  const { weekDays, week, multiWeek, previous, next } = useWeek(
    controller,
    onSelectDay
  )
  const { selectedDay, todayIndex } = controller
  const selectedLabel = format.date(selectedDay.date)

  return (
    <section
      aria-label={t("days.label")}
      className="flex flex-col gap-1.5"
      data-testid="event-shop-day-chips"
    >
      {multiWeek ? (
        <WeekStepper next={next} previous={previous} week={week} />
      ) : null}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const selected = day.index === selectedDay.index
          const dot = controller.dayStates[day.index]?.dot ?? "none"
          return (
            <button
              key={day.index}
              aria-current={day.index === todayIndex ? "date" : undefined}
              aria-label={format.date(day.date)}
              aria-pressed={selected}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md border text-xs",
                selected && "border-primary bg-muted font-semibold",
                day.index < todayIndex && !selected && "opacity-60"
              )}
              data-testid={`event-shop-chip-${day.index}`}
              onClick={() => onSelectDay(day.index)}
              type="button"
            >
              <span>{format.weekday(day.date)}</span>
              <span>{format.dayOfMonth(day.date)}</span>
              <span
                aria-hidden="true"
                className={cn("size-1.5 rounded-full", STATE_DOT[dot])}
                data-state={dot}
              />
            </button>
          )
        })}
      </div>
      <p className="text-sm font-medium" data-testid="event-shop-selected-day">
        {selectedDay.index === todayIndex
          ? t("days.selectedToday", { day: selectedLabel })
          : selectedLabel}
      </p>
    </section>
  )
}
