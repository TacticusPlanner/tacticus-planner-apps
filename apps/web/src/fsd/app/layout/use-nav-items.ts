import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

import {
  orderLegendaryEventsForHub,
  useLegendaryEvents,
  type LegendaryEventLifecycle,
  type LegendaryEventLifecycleState,
} from "@/entities/legendary-event"
import { useUnitName } from "@/shared/unit-name"

import { navItems, type DynamicNavSubItem, type NavItem } from "./nav-items"
import { useDateLocale } from "@/shared/lib"

const DESCRIPTION_KEY = {
  active: "legendaryEvents.tabs.activeEventDescription",
  upcoming: "legendaryEvents.tabs.upcomingEventDescription",
  archived: "legendaryEvents.tabs.archivedEventDescription",
} as const satisfies Record<LegendaryEventLifecycleState, string>

/** The date the event's page header names: when the current run ends for an active event, when
 *  the next run starts for an upcoming one; nothing for an archived or TBA one. */
function runDate(
  lifecycle: LegendaryEventLifecycle,
  locale: string,
  t: TFunction<"common">
): string | undefined {
  if (lifecycle.runStartMs === undefined) return undefined
  const active = lifecycle.state === "active"
  const date = new Date(
    active ? lifecycle.runEndMs : lifecycle.runStartMs
  ).toLocaleDateString(locale, { dateStyle: "medium" })
  return t(
    active
      ? "legendaryEvents.tabs.runEndsOn"
      : "legendaryEvents.tabs.runStartsOn",
    { date }
  )
}

/**
 * `navItems` with each section's `dynamicChildren` resolved (design D1). For `legendaryEvents`
 * the static All events child comes first, then every catalog event in hub order (active,
 * upcoming, archived), each described by its lifecycle; while the catalog read is pending or
 * failed only the static children remain, so every nav surface keeps working without the data.
 */
export function useNavItems(): NavItem[] {
  const { t, i18n } = useTranslation("common")
  const dateLocale = useDateLocale()
  const events = useLegendaryEvents()
  const unitName = useUnitName()
  const ordered =
    events.status === "ready"
      ? orderLegendaryEventsForHub(
          events.data,
          events.nowMs,
          (event) => unitName("Character", event.id),
          i18n.language
        )
      : { active: [], upcoming: [], archived: [] }
  // Re-derived on each render (a lifecycle flip, a language or name change) from the cached reads;
  // keyed by the serialized children below so the items keep their identity while nothing changed.
  const eventChildren: DynamicNavSubItem[] = [
    ...ordered.active,
    ...ordered.upcoming,
    ...ordered.archived,
  ].map(({ event, lifecycle }) => ({
    path: `/legendary-events/${event.id}`,
    label: unitName("Character", event.id),
    description: [
      t(DESCRIPTION_KEY[lifecycle.state]),
      runDate(lifecycle, dateLocale, t),
    ]
      .filter(Boolean)
      .join(" · "),
    iconSrc: characterIcon(event.id as UnitId),
  }))
  const signature = JSON.stringify(eventChildren)

  return useMemo(
    () =>
      navItems.map((item) =>
        item.dynamicChildren === "legendaryEvents"
          ? { ...item, children: [...(item.children ?? []), ...eventChildren] }
          : item
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the serialized children
    [signature]
  )
}
