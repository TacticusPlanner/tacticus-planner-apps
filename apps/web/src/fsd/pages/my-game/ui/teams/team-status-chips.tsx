import { cn } from "@workspace/ui/lib/utils"

import type { TeamStatusItem } from "./use-team-status"

const KIND_CLASS: Record<TeamStatusItem["kind"], string> = {
  cap: "text-muted-foreground",
  // Amber on its tint passes AA; a rule error uses darker or lighter red text than the
  // destructive token, which on its own tint falls under 4.5:1 at this size.
  warn: "border-amber-600/45 bg-amber-500/12 text-amber-800 dark:text-amber-400",
  error:
    "border-destructive/60 bg-destructive/14 text-red-700 dark:text-red-300",
}

/** One status fact as a small chip (handoff 5.7): text only, no role. */
function StatusChip({ item }: { item: TeamStatusItem }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center rounded-md border px-1.5 py-0.5 text-xs font-medium",
        KIND_CLASS[item.kind]
      )}
      data-kind={item.kind}
      data-testid="team-status-chip"
      title={item.title}
    >
      <span className="truncate">{item.text}</span>
    </span>
  )
}

/** A team's chips: in a row on a card, stacked in a table cell. */
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
  return (
    <div
      className={cn(
        "flex gap-1",
        stacked ? "flex-col items-start" : "flex-wrap",
        className
      )}
      data-testid="team-status"
    >
      {items.map((item) => (
        <StatusChip item={item} key={item.key} />
      ))}
    </div>
  )
}
