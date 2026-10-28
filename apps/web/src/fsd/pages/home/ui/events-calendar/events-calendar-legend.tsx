import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@workspace/ui/lib/utils"

import {
  EVENT_FAMILIES_IN_LEGEND_ORDER,
  eventFamilySwatchClass,
  resolveEventFamily,
  type EventFamily,
} from "@/shared/lib"
import type { EventsCalendarDay } from "../../model/events-calendar.types"

/** Only the families present in the visible range. */
function collectVisibleFamilies(days: EventsCalendarDay[]): Set<EventFamily> {
  const families = new Set<EventFamily>()
  for (const day of days) {
    for (const entry of day.entries) {
      families.add(resolveEventFamily(entry.definitionType))
    }
  }
  return families
}

export function EventsCalendarLegend({ days }: { days: EventsCalendarDay[] }) {
  const { t } = useTranslation("events")
  const visible = useMemo(() => collectVisibleFamilies(days), [days])
  const ordered = EVENT_FAMILIES_IN_LEGEND_ORDER.filter((family) =>
    visible.has(family)
  )

  if (ordered.length === 0) {
    return null
  }

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5"
      data-testid="events-calendar-legend"
    >
      {ordered.map((family) => (
        <div className="flex items-center gap-1.5" key={family}>
          <span
            aria-hidden="true"
            className={cn(
              "h-3 w-1 shrink-0 rounded-full",
              eventFamilySwatchClass(family)
            )}
          />
          <span className="text-xs text-muted-foreground">
            {t(`families.${family}`)}
          </span>
        </div>
      ))}
    </div>
  )
}
