import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

import {
  orderLegendaryEventsForHub,
  useLegendaryEvents,
  type LegendaryEventLifecycleState,
} from "@/entities/legendary-event"
import { useUnitName } from "@/shared/unit-name"

import { navItems, type DynamicNavSubItem, type NavItem } from "./nav-items"

const DESCRIPTION_KEY = {
  active: "legendaryEvents.tabs.activeEventDescription",
  upcoming: "legendaryEvents.tabs.upcomingEventDescription",
  archived: "legendaryEvents.tabs.archivedEventDescription",
} as const satisfies Record<LegendaryEventLifecycleState, string>

/**
 * `navItems` with each section's `dynamicChildren` resolved (design D1). For `legendaryEvents`
 * the static All events child comes first, then every catalog event in hub order (active,
 * upcoming, archived), each described by its lifecycle; while the catalog read is pending or
 * failed only the static children remain, so every nav surface keeps working without the data.
 */
export function useNavItems(): NavItem[] {
  const { t, i18n } = useTranslation("common")
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
  // `unitName` is a new function every render; the names it resolves are what matter.
  const eventChildren: DynamicNavSubItem[] = [
    ...ordered.active,
    ...ordered.upcoming,
    ...ordered.archived,
  ].map(({ event, lifecycle }) => ({
    path: `/legendary-events/${event.id}`,
    label: unitName("Character", event.id),
    description: t(DESCRIPTION_KEY[lifecycle.state]),
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
