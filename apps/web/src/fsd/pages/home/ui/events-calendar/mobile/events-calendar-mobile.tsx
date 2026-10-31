import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useMinuteNow } from "@/entities/legendary-event"
import { formatEventCountdown, useDateLocale } from "@/shared/lib"

import { parseLocalDate, toIsoDate } from "../../../model/events-calendar-calc"
import type { EventsAgenda } from "../../../model/events-calendar.types"
import { EventAgendaRow, OngoingEventTile } from "../event-entry-card"

// An agenda rather than desktop's 7-column grid: what was already running when the range starts is
// listed once under "Ongoing", then each day lists only what starts or ends on it, plus its one-day
// events — so a week-long event appears at most twice instead of on every day it spans.
export function EventsCalendarMobile({ agenda }: { agenda: EventsAgenda }) {
  const { t, i18n } = useTranslation("events")
  const dateLocale = useDateLocale()
  const dayHeaderFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(dateLocale, {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
    [dateLocale]
  )
  // Ticks each minute so the Ongoing countdowns stay current.
  const nowMs = useMinuteNow()

  if (agenda.ongoing.length === 0 && agenda.days.length === 0) {
    return (
      <p
        className="py-6 text-center text-sm text-muted-foreground"
        data-testid="events-calendar-mobile-empty"
      >
        {t("states.empty")}
      </p>
    )
  }

  const todayIso = toIsoDate(new Date(nowMs))

  return (
    <div className="flex flex-col gap-4" data-testid="events-calendar-mobile">
      {agenda.ongoing.length > 0 ? (
        <section data-testid="events-calendar-ongoing">
          <h3 className="mb-2 text-sm font-medium">{t("agenda.ongoing")}</h3>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {agenda.ongoing.map((entry) => (
              <OngoingEventTile
                endsInText={t("agenda.endsIn", {
                  when: formatEventCountdown(
                    Date.parse(entry.endUtc),
                    nowMs,
                    i18n.language,
                    { withHours: true }
                  ),
                })}
                entry={entry}
                key={entry.key}
              />
            ))}
          </div>
        </section>
      ) : null}
      {agenda.days.map((day) => {
        const isToday = day.date === todayIso

        return (
          <section data-testid="events-calendar-day-section" key={day.date}>
            <h3
              className="mb-2 text-sm font-medium data-[today=true]:text-primary"
              data-today={isToday}
            >
              {dayHeaderFormatter.format(parseLocalDate(day.date))}
            </h3>
            <div className="flex flex-col gap-1.5">
              {day.entries.map((entry) => (
                <EventAgendaRow
                  entry={entry}
                  isOccurrenceEnd={entry.isOccurrenceEnd}
                  isOccurrenceStart={entry.isOccurrenceStart}
                  key={entry.key}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
