import { useTranslation } from "react-i18next"

import { useDateLocale } from "@/shared/lib"
import { EventIcon, EventInstanceSwitcher } from "@/shared/ui"

import type {
  HomeScreenEventEntry,
  HomeScreenEventInstance,
} from "../../model/select-active-home-screen-event"
import {
  formatHomeScreenEventDates,
  useHomeScreenEventName,
} from "./use-home-screen-event-name"

/**
 * Picks which Home Screen Event instance the HSE tab shows: the shared event switcher (a select
 * grouped Running / Upcoming / Past between Previous / Next buttons), each option the event's
 * medallion, its localized name and date range.
 */
export function EventSwitcher({
  instances,
  selectedKey,
  onSelect,
  className,
}: {
  instances: readonly HomeScreenEventInstance<HomeScreenEventEntry>[]
  selectedKey: string | null
  onSelect: (key: string) => void
  className?: string
}) {
  const { t } = useTranslation("dailies")
  const dateLocale = useDateLocale()
  const eventName = useHomeScreenEventName()

  return (
    <EventInstanceSwitcher
      className={className}
      instances={instances}
      labels={{
        label: t("hse.switcher.label"),
        placeholder: t("hse.switcher.placeholder"),
        empty: t("hse.switcher.empty"),
        previous: t("hse.switcher.previous"),
        next: t("hse.switcher.next"),
        groups: {
          running: t("hse.switcher.groups.running"),
          upcoming: t("hse.switcher.groups.upcoming"),
          past: t("hse.switcher.groups.past"),
        },
      }}
      onSelect={onSelect}
      renderOption={(instance) => (
        <>
          <EventIcon
            className="size-6 shrink-0"
            definitionId={instance.entry.definitionId}
            definitionType="HomeScreenEvent"
            parameters={instance.entry.parameters ?? null}
          />
          {t("hse.switcher.option", {
            name: eventName(instance.entry),
            dates: formatHomeScreenEventDates(instance.entry, dateLocale),
          })}
        </>
      )}
      selectedKey={selectedKey}
      testIdPrefix="hse-event"
    />
  )
}
