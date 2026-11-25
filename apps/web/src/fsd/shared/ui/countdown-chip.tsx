import { countdownIcon } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "./entity-icon"

/** A countdown ("Ends in 8 days 15 hr") with the game's timer icon, as Home's event tiles and
 *  Today's Campaign event tile show it. */
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
      <EntityIcon size="icon" alt="" src={countdownIcon()} />
      {text}
    </span>
  )
}
