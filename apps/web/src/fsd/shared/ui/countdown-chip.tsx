import { countdownIcon } from "@workspace/game-catalog"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "./entity-icon"

/** A countdown ("Ends in 8 days 15 hr", or a compact "8d 15h") with the game's timer icon, as
 *  Home's event tiles and Today's Campaign event tile show it. A compact `text` passes the full
 *  phrase as `srText`, so a screen reader hears "Ends in 8 days 15 hr", not "8d 15h". */
export function CountdownChip({
  text,
  srText,
  className,
}: {
  text: string
  srText?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 text-xs font-semibold whitespace-nowrap tabular-nums",
        className
      )}
    >
      <EntityIcon size="icon-sm" alt="" src={countdownIcon()} />
      {srText ? (
        <>
          <span aria-hidden="true">{text}</span>
          <span className="sr-only">{srText}</span>
        </>
      ) : (
        text
      )}
    </span>
  )
}
