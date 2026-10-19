import { useTranslation } from "react-i18next"

import {
  orderLegendaryEventsForHub,
  useLegendaryEvents,
  type LegendaryEvent,
} from "@/entities/legendary-event"
import { useUnitName } from "@/shared/unit-name"

/** One Legendary Event a project can relate to: its catalog id and localized name. */
export type EventTargetOption = { eventId: string; name: string }

/**
 * The Related to choices (project-event-target): active and upcoming events first in start order,
 * then the rest by localized name, as the Legendary Events hub orders them.
 */
export function eventTargetOptions(
  events: readonly Pick<LegendaryEvent, "id" | "eventStageStartDatesUtc">[],
  nowMs: number,
  nameOf: (eventId: string) => string,
  locale?: string
): EventTargetOption[] {
  const groups = orderLegendaryEventsForHub(
    events,
    nowMs,
    (event) => nameOf(event.id),
    locale
  )
  return [...groups.active, ...groups.upcoming, ...groups.archived].map(
    ({ event }) => ({ eventId: event.id, name: nameOf(event.id) })
  )
}

/** The served events as Related to choices, or none while the catalog loads. */
export function useEventTargetOptions(): EventTargetOption[] {
  const { i18n } = useTranslation()
  const events = useLegendaryEvents()
  const unitName = useUnitName()
  if (events.status !== "ready") return []
  return eventTargetOptions(
    events.data,
    events.nowMs,
    (id) => unitName("Character", id),
    i18n.language
  )
}
