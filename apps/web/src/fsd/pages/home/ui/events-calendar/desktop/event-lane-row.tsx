import { cn } from "@workspace/ui/lib/utils"

import type { EventLane } from "../../../model/events-calendar.types"
import { EventBar } from "../event-entry-card"

const DAY_COLUMNS = 7
// Matches the grid's `gap-2` (0.5rem) between the seven day columns.
const GAP_REM = 0.5

/** A fractional day-column offset as a CSS length across the 7-column, gapped grid. */
function offsetToCss(offset: number): string {
  const column =
    offset > 0 && Number.isInteger(offset) ? offset - 1 : Math.floor(offset)
  const fraction = offset - column
  const columnWidth = `((100% - ${(DAY_COLUMNS - 1) * GAP_REM}rem) / ${DAY_COLUMNS})`
  return `(${column} * (${columnWidth} + ${GAP_REM}rem) + ${fraction} * ${columnWidth})`
}

/** One Gantt row: bars span whole day columns, or, in a timed row, sit at their exact start and end. */
export function EventLaneRow({
  lane,
  compact = false,
}: {
  lane: EventLane
  compact?: boolean
}) {
  const height = compact ? "h-7" : "h-10"

  if (lane.timed) {
    return (
      <div
        className={cn("relative", height)}
        data-testid="events-calendar-timed-lane"
      >
        {lane.entries.map((entry) => {
          const left = offsetToCss(entry.startOffset)
          const right = offsetToCss(entry.endOffset)
          return (
            <div
              className="absolute inset-y-0 min-w-0 pr-0.5"
              key={entry.key}
              style={{
                left: `calc(${left})`,
                width: `calc(${right} - ${left})`,
              }}
            >
              <EventBar
                compact={compact}
                entry={entry}
                iconOnly={entry.endOffset - entry.startOffset < 1.5}
              />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn("grid grid-cols-7 gap-2", height)}>
      {lane.entries.map((entry) => (
        <div
          className="min-w-0"
          key={entry.key}
          style={{
            gridColumn: `${entry.startColumn} / span ${entry.span}`,
          }}
        >
          <EventBar
            compact={compact}
            entry={entry}
            iconOnly={entry.span === 1}
          />
        </div>
      ))}
    </div>
  )
}
