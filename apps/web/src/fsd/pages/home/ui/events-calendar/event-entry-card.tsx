import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"

import type { EventEntryViewModel } from "../../model/events-calendar.types"
import { resolveEventDisplayName } from "../../model/resolve-event-display"
import { EventTypeIcon } from "./event-type-icon"

export function EventEntryCard({ entry }: { entry: EventEntryViewModel }) {
  const { t } = useTranslation(["events", "characters", "factions"])
  const displayName = resolveEventDisplayName(t, entry)

  return (
    <div
      className="flex flex-col gap-1 rounded-lg border bg-card px-2 py-1.5 text-sm data-[active=true]:border-primary data-[active=true]:bg-primary/5"
      data-active={entry.isActiveNow}
      data-testid="event-entry-card"
    >
      <div className="flex min-w-0 items-center gap-1.5" title={displayName}>
        <EventTypeIcon
          className="size-4 shrink-0 text-muted-foreground"
          definitionType={entry.definitionType}
        />
        <span className="min-w-0 flex-1 truncate text-xs font-medium">
          {displayName}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {entry.isActiveNow ? (
          <Badge data-testid="event-active-badge" variant="default">
            {t("events:badges.active")}
          </Badge>
        ) : null}
        <Badge
          data-testid="event-confirmed-badge"
          variant={entry.confirmed ? "outline" : "secondary"}
        >
          {entry.confirmed
            ? t("events:badges.confirmed")
            : t("events:badges.projected")}
        </Badge>
      </div>
    </div>
  )
}
