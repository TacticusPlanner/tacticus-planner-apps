import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

import {
  orderLegendaryEventsForHub,
  useLegendaryEvents,
} from "@/entities/legendary-event"
import { useUnitName } from "@/shared/unit-name"

import { navItems, type DynamicNavSubItem, type NavItem } from "./nav-items"

/**
 * `navItems` with each section's `dynamicChildren` resolved (design D1). For `legendaryEvents`
 * the active events, in hub order, are listed before the static All events child; while the
 * catalog read is pending or failed only the static children remain, so every nav surface keeps
 * working without the data.
 */
export function useNavItems(): NavItem[] {
  const { t, i18n } = useTranslation("common")
  const events = useLegendaryEvents()
  const unitName = useUnitName()
  const activeEvents =
    events.status === "ready"
      ? orderLegendaryEventsForHub(
          events.data,
          events.nowMs,
          (event) => unitName("Character", event.id),
          i18n.language
        ).active
      : []
  // `unitName` is a new function every render; the names it resolves are what matter.
  const activeChildren: DynamicNavSubItem[] = activeEvents.map(({ event }) => ({
    path: `/legendary-events/${event.id}`,
    label: unitName("Character", event.id),
    description: t("legendaryEvents.tabs.activeEventDescription"),
    iconSrc: characterIcon(event.id as UnitId),
  }))
  const signature = JSON.stringify(activeChildren)

  return useMemo(
    () =>
      navItems.map((item) =>
        item.dynamicChildren === "legendaryEvents"
          ? { ...item, children: [...activeChildren, ...(item.children ?? [])] }
          : item
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by the serialized children
    [signature]
  )
}
