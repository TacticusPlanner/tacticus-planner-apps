import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import type { TeamStatusItem } from "../../model/teams/use-team-status"

const KIND_CLASS: Record<TeamStatusItem["kind"], string> = {
  cap: "text-muted-foreground",
  // Amber on its tint passes AA; a rule error uses darker or lighter red text than the
  // destructive token, which on its own tint falls under 4.5:1 at this size.
  warn: "border-warning-foreground/45 bg-warning text-warning-foreground",
  error: "border-destructive/60 bg-destructive/14 text-destructive",
}

/** One status fact as a small chip (handoff 5.7): text only, no role. */
function StatusChip({ item }: { item: TeamStatusItem }) {
  const chip = (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md border px-1.5 py-0.5 text-xs font-medium",
        KIND_CLASS[item.kind]
      )}
      data-kind={item.kind}
      data-testid="team-status-chip"
    >
      <span className="truncate">{item.text}</span>
    </span>
  )
  if (!item.title) return chip
  return (
    <Tooltip>
      <TooltipTrigger asChild>{chip}</TooltipTrigger>
      <TooltipContent>{item.title}</TooltipContent>
    </Tooltip>
  )
}

const SEVERITY: Record<TeamStatusItem["kind"], number> = {
  error: 0,
  warn: 1,
  cap: 2,
}

/** A team's chips: in a row on a card. In a table cell (`stacked`) on two lines, as the Goals table
 *  does: the most serious chip alone on the first, the rest side by side on the second. */
export function TeamStatusChips({
  items,
  stacked = false,
  className,
}: {
  items: readonly TeamStatusItem[]
  stacked?: boolean
  className?: string
}) {
  if (items.length === 0) return null
  if (stacked) {
    const [first, ...rest] = items.toSorted(
      (a, b) => SEVERITY[a.kind] - SEVERITY[b.kind]
    )
    return (
      <div
        className={cn("grid justify-items-start gap-1", className)}
        data-testid="team-status"
      >
        {first ? <StatusChip item={first} /> : null}
        {rest.length > 0 ? (
          <div className="flex max-w-full flex-wrap gap-1">
            {rest.map((item) => (
              <StatusChip item={item} key={item.key} />
            ))}
          </div>
        ) : null}
      </div>
    )
  }
  return (
    <div
      className={cn("flex flex-wrap gap-1", className)}
      data-testid="team-status"
    >
      {items.map((item) => (
        <StatusChip item={item} key={item.key} />
      ))}
    </div>
  )
}
