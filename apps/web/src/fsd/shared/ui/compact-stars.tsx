import { progressionVisual } from "@workspace/game-catalog"
import type { Progression } from "@workspace/game-domain"
import { cn } from "@workspace/ui/lib/utils"

import { EntityIcon } from "./entity-icon"

/**
 * A progression's stars in their short form: one star icon followed by the count (or the single
 * wings image at the top step), as Collection's roster rows show them. Renders nothing for a step
 * with no stars ("None"). Decorative: the caller names the progression for assistive technology.
 */
export function CompactStars({
  progression,
  className,
  "data-testid": testId,
}: {
  progression: Progression
  className?: string
  "data-testid"?: string
}) {
  const visual = progressionVisual(progression)
  if (visual.kind === "none") return null
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs font-semibold tabular-nums",
        className
      )}
      data-testid={testId}
    >
      {visual.kind === "stars" ? (
        <>
          <EntityIcon src={visual.icon} alt="" className="size-3.5" />
          {visual.count}
        </>
      ) : (
        <EntityIcon
          src={visual.icon}
          alt=""
          className="h-4 w-auto"
          width={512}
          height={164}
        />
      )}
    </span>
  )
}
