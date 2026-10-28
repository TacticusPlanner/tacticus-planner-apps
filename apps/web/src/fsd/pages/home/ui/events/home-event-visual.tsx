import { characterIcon, countdownIcon } from "@workspace/game-catalog"
import type { UnitId } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon, EventIcon } from "@/shared/ui"

import type { HomeEventRow } from "../../model/select-home-events"

/** A Home event's picture: the featured hero's portrait for a Legendary Event, else the Home
 *  Screen Event's game medallion. Decorative; the row names the event. */
export function HomeEventVisual({
  row,
  className,
}: {
  row: HomeEventRow
  className?: string
}) {
  if (row.type === "legendaryEvent") {
    return (
      <EntityIcon
        alt=""
        className={cn(
          "shrink-0 rounded-full ring-2 ring-[var(--event-family-heroes)]",
          className
        )}
        src={characterIcon(row.unitId as UnitId)}
      />
    )
  }
  return (
    <EventIcon
      className={cn("shrink-0", className)}
      definitionId={row.definitionId}
      definitionType="HomeScreenEvent"
      parameters={row.parameters}
    />
  )
}

/** A countdown chip with the game's timer icon. */
export function CountdownChip({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 text-xs font-semibold whitespace-nowrap tabular-nums",
        className
      )}
    >
      <EntityIcon alt="" className="size-4" src={countdownIcon()} />
      {text}
    </span>
  )
}
