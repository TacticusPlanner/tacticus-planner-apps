import type { ReactElement, ReactNode } from "react"
import { Link } from "react-router"
import { cn } from "@workspace/ui/lib/utils"

import { TruncatedText } from "@/shared/ui"

import type { HomeEventRow } from "../../model/select-home-events"
import { HomeEventVisual } from "./home-event-visual"
import { useHomeEventName } from "../../model/events/use-home-event-name"

/**
 * One Home event as a two-line tile: its picture, its name, and a line of details under it (a
 * countdown, a start date, synced points). The link fills the tile; an `action` (a Legendary
 * Event's plan button) sits beside it, never inside it. `compact` is Right now's grid tile;
 * otherwise it is a list row as tall as a Your projects row, so Home's cards line up.
 */
export function HomeEventTile({
  row,
  details,
  action,
  compact = false,
  className,
  "data-testid": testId,
}: {
  row: HomeEventRow
  details: ReactNode
  action?: ReactElement
  compact?: boolean
  className?: string
  "data-testid"?: string
}) {
  const eventName = useHomeEventName()

  return (
    <div
      className={cn(
        "flex min-w-0 items-center rounded-xl border interactive-surface has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-ring/50",
        compact ? "min-h-12" : "min-h-18.5",
        className
      )}
      data-testid={testId}
      data-type={row.type}
    >
      <Link
        className={cn(
          "flex min-w-0 flex-1 items-center self-stretch rounded-xl outline-none",
          compact ? "gap-2 px-2 py-1.5" : "gap-3 p-3"
        )}
        data-live={row.live}
        data-testid="home-events-row"
        data-type={row.type}
        to={row.destination}
      >
        <HomeEventVisual row={row} size={compact ? "icon-lg" : "icon-xl"} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <TruncatedText className="text-sm font-semibold">
            {eventName(row)}
          </TruncatedText>
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            {details}
          </span>
        </span>
      </Link>
      {action === undefined ? null : (
        <div className={cn("shrink-0", compact ? "pr-2" : "pr-3")}>
          {action}
        </div>
      )}
    </div>
  )
}
