import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { eventDays } from "@workspace/game-catalog"
import type { EventShopDay } from "@workspace/game-catalog"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import { Pressable } from "@workspace/ui/components/pressable"
import {
  SelectionGroup,
  SelectionItem,
} from "@workspace/ui/components/selection-group"

import { EntityIcon } from "@/shared/ui"

import { STATE_DOT, STATE_RING } from "./day-state-style"
import type { EventShopController } from "../../model/event-shop/use-event-shop-controller"
import type { EventShopFormat } from "../../model/event-shop/use-event-shop-format"

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
      <DayGroup controller={controller} onSelectDay={onSelectDay}>
        {weekDays.map((day) => (
          <CalendarDay
            key={day.index}
            controller={controller}
            day={day}
            format={format}
          />
        ))}
      </DayGroup>
    </section>
  )
}

/** The week's seven days as one radio group: one tab stop, arrow keys between days. */
function DayGroup({
  controller,
  onSelectDay,
  children,
}: {
  controller: EventShopController
  onSelectDay: (day: number) => void
  children: ReactNode
}) {
  const { t } = useTranslation("eventShops")
  return (
    <SelectionGroup
      aria-label={t("days.label")}
      className="grid grid-cols-7 gap-1"
      // "" is the selected day pressed again: it stays selected.
      onValueChange={(day) => {
        if (day !== "") onSelectDay(Number(day))
      }}
      value={String(controller.selectedDay.index)}
    >
      {children}
    </SelectionGroup>
  )
}

function CalendarDay({
  controller,
  day,
  format,
}: {
  controller: EventShopController
  day: EventShopDay
  format: EventShopFormat
}) {
  const { t } = useTranslation("eventShops")
  const state = controller.dayStates[day.index]
  const items = state?.items ?? []
  const selected = day.index === controller.selectedDay.index
  const today = day.index === controller.todayIndex
  const past = day.index < controller.todayIndex

  return (
    <SelectionItem asChild value={String(day.index)}>
      <Pressable
        aria-current={today ? "date" : undefined}
        aria-label={`${format.date(day.date)}${today ? ` · ${t("days.today")}` : ""}, ${items.length > 0 ? t("days.planned", { count: items.length }) : t("days.nothingPlanned")}`}
        className={cn(
          "flex min-h-24 flex-col items-stretch gap-1 rounded-md border p-1.5 text-left",
          selected && "border-primary bg-muted",
          past && !selected && "opacity-60"
        )}
        data-testid={`event-shop-day-${day.index}`}
      >
        <span className="flex items-baseline justify-between gap-1 text-xs">
          <span className="font-medium">{format.weekday(day.date)}</span>
          <span className="text-muted-foreground">
            {format.dayOfMonth(day.date)}
          </span>
        </span>
        {today ? (
          <span className="text-xs font-semibold text-primary">
            {t("days.today")}
          </span>
        ) : null}
        <span className="flex flex-wrap gap-1">
          {items.map((item) => {
            const reward = format.reward(item.rewardType)
            return (
              <EntityIcon
                size="icon"
                key={`${item.slotIndex}-${item.rewardType}`}
                alt={reward.label}
                className={cn("rounded-sm ring-2", STATE_RING[item.state])}
                src={reward.iconUrl}
              />
            )
          })}
        </span>
      </Pressable>
    </SelectionItem>
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
      <DayGroup controller={controller} onSelectDay={onSelectDay}>
        {weekDays.map((day) => {
          const selected = day.index === selectedDay.index
          const dot = controller.dayStates[day.index]?.dot ?? "none"
          return (
            <SelectionItem asChild key={day.index} value={String(day.index)}>
              <Pressable
                aria-current={day.index === todayIndex ? "date" : undefined}
                aria-label={format.date(day.date)}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-md border text-xs",
                  selected && "border-primary bg-muted font-semibold",
                  day.index < todayIndex && !selected && "opacity-60"
                )}
                data-testid={`event-shop-chip-${day.index}`}
              >
                <span>{format.weekday(day.date)}</span>
                <span>{format.dayOfMonth(day.date)}</span>
                <span
                  aria-hidden="true"
                  className={cn("size-1.5 rounded-full", STATE_DOT[dot])}
                  data-state={dot}
                />
              </Pressable>
            </SelectionItem>
          )
        })}
      </DayGroup>
      <p className="text-sm font-medium" data-testid="event-shop-selected-day">
        {selectedDay.index === todayIndex
          ? t("days.selectedToday", { day: selectedLabel })
          : selectedLabel}
      </p>
    </section>
  )
}
