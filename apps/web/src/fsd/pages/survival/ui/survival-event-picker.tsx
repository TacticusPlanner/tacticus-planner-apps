import { useTranslation } from "react-i18next"
import { characterIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"

import { useSurvivalEventName } from "@/entities/team"
import {
  EntityIcon,
  EventInstanceSwitcher,
  formatEventWindow,
} from "@/shared/ui"
import { useUnitName } from "@/shared/unit-name"

import type { SurvivalEvent } from "../model/survival-event"
import { survivalEventStatus } from "../model/survival-event-status"

/**
 * The event every tab shows (ui-style-guide rule 2): Previous, Next and a select grouped Running,
 * Upcoming and Past, each option with the featured hero's portrait and "December 2026 · Actus".
 * Events without dates sit with the upcoming ones.
 */
export function SurvivalEventPicker({
  events,
  selectedId,
  now,
  onSelect,
}: {
  events: readonly SurvivalEvent[]
  selectedId: string
  now: number
  onSelect: (eventId: string) => void
}) {
  const { t, i18n } = useTranslation("survival")
  const eventName = useSurvivalEventName()
  const unitName = useUnitName()
  const instances = events.map((event) => {
    const status = survivalEventStatus(event, now)
    return {
      key: event.id,
      status: status === "undated" ? ("upcoming" as const) : status,
      event,
    }
  })
  return (
    <EventInstanceSwitcher
      className="min-w-0 md:max-w-120"
      instances={instances}
      labels={{
        label: t("switcher.label"),
        placeholder: t("switcher.placeholder"),
        empty: t("switcher.empty"),
        previous: t("switcher.previous"),
        next: t("switcher.next"),
        groups: {
          running: t("switcher.groups.running"),
          upcoming: t("switcher.groups.upcoming"),
          past: t("switcher.groups.past"),
        },
      }}
      onSelect={onSelect}
      renderOption={({ event }) => (
        <span className="flex min-w-0 items-center gap-2">
          <EntityIcon
            alt=""
            size="portrait-sm"
            src={characterIcon(event.featuredCharacterId as UnitId)}
          />
          <span className="flex min-w-0 flex-col">
            <span className="truncate">
              {t("switcher.option", {
                name: eventName(event.id),
                hero: unitName("Character", event.featuredCharacterId),
              })}
            </span>
            <span className="text-xs text-muted-foreground in-data-[slot=select-value]:hidden">
              {event.startUtc !== null && event.endUtc !== null
                ? formatEventWindow(
                    { startUtc: event.startUtc, endUtc: event.endUtc },
                    i18n.language
                  )
                : t("line.tba")}
            </span>
          </span>
        </span>
      )}
      selectedKey={selectedId}
      testIdPrefix="survival-event"
    />
  )
}
