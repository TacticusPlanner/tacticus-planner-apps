import { useTranslation } from "react-i18next"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import {
  eventAccentClass,
  eventBarClass,
  resolveEventColorKey,
} from "../../model/event-colors"
import type { EventEntryViewModel } from "../../model/events-calendar.types"
import { resolveEventDisplayName } from "../../model/resolve-event-display"
import { EventTypeIcon } from "./event-type-icon"

export function EventEntryCard({
  entry,
  variant = "list",
}: {
  entry: EventEntryViewModel
  /** "list" (default): mobile's stacked cards. "bar": desktop's colored Gantt-lane bars. */
  variant?: "list" | "bar"
}) {
  const { t } = useTranslation([
    "events",
    "characters",
    "factions",
    "progression",
  ])
  const displayName = resolveEventDisplayName(t, entry)
  const colorKey = resolveEventColorKey(
    entry.definitionId,
    entry.definitionType
  )

  if (variant === "bar") {
    return (
      <div
        className={cn(
          "flex h-full min-w-0 items-center gap-1.5 truncate rounded-md border px-2 text-xs font-medium",
          eventBarClass(colorKey),
          entry.confirmed
            ? "border-transparent"
            : "border-dashed border-current/40 opacity-80",
          entry.isActiveNow &&
            "ring-2 ring-primary ring-offset-1 ring-offset-background"
        )}
        data-active={entry.isActiveNow}
        data-confirmed={entry.confirmed}
        data-testid="event-entry-card"
        title={displayName}
      >
        <EventTypeIcon
          className="size-3.5 shrink-0"
          definitionType={entry.definitionType}
        />
        <span className="min-w-0 flex-1 truncate">{displayName}</span>
        {/* Visual state is carried by border style (confirmed vs projected) and the ring (active) — these
            stay for assistive tech and existing test coverage without cluttering the compact bar. */}
        {entry.isActiveNow ? (
          <span className="sr-only" data-testid="event-active-badge">
            {t("events:badges.active")}
          </span>
        ) : null}
        <span className="sr-only" data-testid="event-confirmed-badge">
          {entry.confirmed
            ? t("events:badges.confirmed")
            : t("events:badges.projected")}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-lg border border-l-4 bg-card px-2 py-1.5 text-sm",
        "data-[active=true]:border-primary data-[active=true]:bg-primary/5",
        eventAccentClass(colorKey)
      )}
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
