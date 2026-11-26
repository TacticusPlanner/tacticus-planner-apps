import type { ReactElement, ReactNode } from "react"
import { Link } from "react-router"
import { cn } from "@workspace/ui/lib/utils"

import { TruncatedText } from "@/shared/ui"

import type { HomeEventRow } from "../../model/select-home-events"
import { HomeEventVisual } from "./home-event-visual"
import { useHomeEventName } from "./use-home-event-name"

/**
 * One Home event as a two-line tile: its picture, its name, and a line of details under it (a
 * countdown, a start date, synced points). The link fills the tile (a row with no destination is
 * the same tile without a link); an `action` (a Legendary
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
  const bodyClassName = cn(
    "flex min-w-0 flex-1 items-center self-stretch rounded-xl",
    compact ? "gap-2 px-2 py-1.5" : "gap-3 p-3"
  )
  const body = (
    <>
      <HomeEventVisual row={row} size={compact ? "icon-lg" : "icon-xl"} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <TruncatedText className="text-sm font-semibold">
          {eventName(row)}
        </TruncatedText>
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {details}
        </span>
      </span>
    </>
  )

  return (
    <div
      className={cn(
        "flex min-w-0 items-center rounded-xl border has-[a:focus-visible]:outline-3 has-[a:focus-visible]:outline-ring/50",
        // A tile that opens nothing gets no hover or press tint.
        row.destination !== null && "interactive-surface",
        compact ? "min-h-12" : "min-h-18.5",
        className
      )}
      data-testid={testId}
      data-type={row.type}
    >
      {row.destination === null ? (
        // No page yet (a Guild War preparation phase): the same tile, opening nothing.
        <div
          className={bodyClassName}
          data-live={row.live}
          data-testid="home-events-row"
          data-type={row.type}
        >
          {body}
        </div>
      ) : (
        <Link
          className={cn(bodyClassName, "outline-none")}
          data-live={row.live}
          data-testid="home-events-row"
          data-type={row.type}
          to={row.destination}
        >
          {body}
        </Link>
      )}
      {action === undefined ? null : (
        <div className={cn("shrink-0", compact ? "pr-2" : "pr-3")}>
          {action}
        </div>
      )}
    </div>
  )
}
